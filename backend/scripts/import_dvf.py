import asyncio
import asyncpg
import pandas as pd
import os
import argparse
import hashlib
import json
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_URL = os.getenv("DATABASE_URL")
print("Using DB:", DB_URL)


USE_COLUMNS = [
    "No disposition",
    "Date mutation",
    "Nature mutation",
    "Valeur fonciere",
    "Code departement",
    "Code commune",
    "Commune",
    "Type local",
    "Surface reelle bati",
]


def clean_number(value):
    if pd.isna(value):
        return None
    try:
        return float(str(value).replace(",", "."))
    except Exception:
        return None


def make_transaction_id(row):
    raw_key = "|".join([
        str(row.get("Date mutation", "")),
        str(row.get("No disposition", "")),
        str(row.get("Valeur fonciere", "")),
        str(row.get("Code departement", "")),
        str(row.get("Code commune", "")),
        str(row.get("Commune", "")),
    ])
    return hashlib.sha1(raw_key.encode("utf-8")).hexdigest()


async def import_dvf(filepath: str):
    if not DB_URL:
        raise RuntimeError("DATABASE_URL is missing. Check backend/.env")

    print(f"Reading DVF file: {filepath}")
    print("This file is large, so we process it in chunks...")

    transactions = {}

    chunk_number = 0

    for chunk in pd.read_csv(
        filepath,
        sep="|",
        dtype=str,
        usecols=USE_COLUMNS,
        chunksize=200000,
        encoding="utf-8",
        low_memory=False,
    ):
        chunk_number += 1
        print(f"Processing chunk {chunk_number}...")

        # Keep only department 94 = Val-de-Marne
        chunk = chunk[chunk["Code departement"] == "94"].copy()

        if chunk.empty:
            continue

        # Keep only real sales
        chunk = chunk[chunk["Nature mutation"] == "Vente"].copy()

        # Keep only houses and apartments
        chunk = chunk[chunk["Type local"].isin(["Appartement", "Maison"])].copy()

        if chunk.empty:
            continue

        chunk["price"] = chunk["Valeur fonciere"].apply(clean_number)
        chunk["surface"] = chunk["Surface reelle bati"].apply(clean_number)

        chunk = chunk.dropna(subset=["price", "surface"])
        chunk = chunk[chunk["price"] > 0]
        chunk = chunk[chunk["surface"] > 5]

        for _, row in chunk.iterrows():
            commune_code = str(row["Code commune"]).zfill(3)
            commune_insee_code = f"94{commune_code}"

            tx_id = make_transaction_id(row)

            if tx_id not in transactions:
                transactions[tx_id] = {
                    "transaction_id": tx_id,
                    "date_mutation": row["Date mutation"],
                    "price": float(row["price"]),
                    "surface": 0.0,
                    "commune_insee_code": commune_insee_code,
                    "commune_name": row["Commune"],
                    "type_local": row["Type local"],
                }

            # Same transaction can appear on multiple rows/lots, so sum surfaces
            transactions[tx_id]["surface"] += float(row["surface"])

    print(f"Grouped transactions before filtering: {len(transactions)}")

    clean_rows = []

    for tx in transactions.values():
        if tx["surface"] <= 0:
            continue

        price_per_sqm = tx["price"] / tx["surface"]

        # Remove unrealistic values
        if price_per_sqm < 500 or price_per_sqm > 30000:
            continue

        clean_rows.append((
            tx["transaction_id"],
            pd.to_datetime(tx["date_mutation"], dayfirst=True).date(),
            tx["price"],
            tx["surface"],
            price_per_sqm,
            tx["commune_insee_code"],
            tx["type_local"],
            json.dumps({
                "commune_name": tx["commune_name"],
                "type_local": tx["type_local"],
            }, ensure_ascii=False),
        ))

    print(f"Clean transactions after filtering: {len(clean_rows)}")

    conn = await asyncpg.connect(DB_URL)

    print("Clearing old transactions and stats...")
    await conn.execute("TRUNCATE TABLE transactions")
    await conn.execute("TRUNCATE TABLE commune_stats")

    batch_size = 1000

    for i in range(0, len(clean_rows), batch_size):
        batch = clean_rows[i:i + batch_size]

        await conn.executemany("""
            INSERT INTO transactions (
                transaction_id,
                date_mutation,
                price,
                surface_reelle_bati,
                price_per_sqm,
                commune_insee_code,
                type_local,
                raw_data
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
            ON CONFLICT DO NOTHING
        """, batch)

        print(f"Inserted {min(i + batch_size, len(clean_rows))}/{len(clean_rows)} transactions...")

    print("Updating commune names from DVF...")
    await conn.execute("""
        UPDATE communes c
        SET name = names.commune_name
        FROM (
            SELECT
                commune_insee_code,
                MAX(raw_data->>'commune_name') AS commune_name
            FROM transactions
            GROUP BY commune_insee_code
        ) names
        WHERE c.insee_code = names.commune_insee_code
    """)

    await conn.close()

    print("✅ DVF import complete")


async def compute_stats():
    print("Computing commune statistics...")

    conn = await asyncpg.connect(DB_URL)

    await conn.execute("""
        INSERT INTO commune_stats (
            commune_insee_code,
            transaction_count,
            avg_price,
            median_price,
            avg_surface,
            avg_price_per_sqm,
            median_price_per_sqm,
            min_price_per_sqm,
            max_price_per_sqm
        )
        SELECT
            commune_insee_code,
            COUNT(*) AS transaction_count,
            ROUND(AVG(price)::numeric, 0) AS avg_price,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::numeric, 0) AS median_price,
            ROUND(AVG(surface_reelle_bati)::numeric, 1) AS avg_surface,
            ROUND(AVG(price_per_sqm)::numeric, 0) AS avg_price_per_sqm,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_sqm)::numeric, 0) AS median_price_per_sqm,
            ROUND(MIN(price_per_sqm)::numeric, 0) AS min_price_per_sqm,
            ROUND(MAX(price_per_sqm)::numeric, 0) AS max_price_per_sqm
        FROM transactions
        GROUP BY commune_insee_code
        HAVING COUNT(*) >= 5
    """)

    count = await conn.fetchval("SELECT COUNT(*) FROM commune_stats")
    print(f"✅ Stats computed for {count} communes")

    await conn.close()


async def main(filepath: str):
    await import_dvf(filepath)
    await compute_stats()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to DVF CSV file")
    args = parser.parse_args()

    asyncio.run(main(args.file))