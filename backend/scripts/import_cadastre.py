import asyncio
import asyncpg
import gzip
import json
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_URL = os.getenv("DATABASE_URL")
print("Using DB:", DB_URL)


async def import_parcels(filepath: str):
    print(f"Loading cadastre file: {filepath}")

    if filepath.endswith(".gz"):
        with gzip.open(filepath, "rt", encoding="utf-8") as f:
            data = json.load(f)
    else:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

    features = data.get("features", [])
    print(f"Found {len(features)} parcel features")

    conn = await asyncpg.connect(DB_URL)

    print("Clearing old parcel and commune data...")
    await conn.execute("TRUNCATE TABLE parcels CASCADE")
    await conn.execute("TRUNCATE TABLE communes CASCADE")

    batch = []
    batch_size = 1000

    for i, feature in enumerate(features):
        props = feature.get("properties", {})
        geometry = feature.get("geometry")

        if not geometry:
            continue

        # In this cadastre file, commune is already full INSEE code like 94001
        commune_code = str(props.get("commune", "")).strip()

        if not commune_code:
            continue

        parcel_id = props.get("id") or f"parcel_{i}"

        batch.append((
            parcel_id,
            commune_code,
            props.get("section"),
            props.get("numero"),
            props.get("contenance"),
            json.dumps(geometry),
            json.dumps(props)
        ))

        if len(batch) >= batch_size:
            await conn.executemany("""
                INSERT INTO parcels (
                    id, commune_code, section, numero, contenance, geom, raw_properties
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
                    $7::jsonb
                )
                ON CONFLICT (id) DO NOTHING
            """, batch)

            print(f"Inserted {i + 1}/{len(features)} parcels...")
            batch = []

    if batch:
        await conn.executemany("""
            INSERT INTO parcels (
                id, commune_code, section, numero, contenance, geom, raw_properties
            )
            VALUES (
                $1, $2, $3, $4, $5,
                ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
                $7::jsonb
            )
            ON CONFLICT (id) DO NOTHING
        """, batch)

    total = await conn.fetchval("SELECT COUNT(*) FROM parcels")
    print(f"✅ Imported {total} parcels")

    await conn.close()


async def build_commune_geometries():
    print("Building commune geometries from parcels...")

    conn = await asyncpg.connect(DB_URL)

    commune_codes = await conn.fetch("""
        SELECT DISTINCT commune_code
        FROM parcels
        ORDER BY commune_code
    """)

    print(f"Found {len(commune_codes)} communes")

    for row in commune_codes:
        code = row["commune_code"]

        await conn.execute("""
            INSERT INTO communes (insee_code, name, geom, bbox)
            WITH merged AS (
                SELECT
                    ST_Multi(
                        ST_SimplifyPreserveTopology(
                            ST_UnaryUnion(ST_Collect(geom)),
                            0.00005
                        )
                    ) AS geom
                FROM parcels
                WHERE commune_code = $1
            )
            SELECT
                $1,
                $1,
                geom,
                ST_AsGeoJSON(ST_Envelope(geom))::jsonb
            FROM merged
            WHERE geom IS NOT NULL
            ON CONFLICT (insee_code) DO UPDATE SET
                geom = EXCLUDED.geom,
                bbox = EXCLUDED.bbox
        """, code)

        print(f"Built geometry for commune {code}")

    total = await conn.fetchval("SELECT COUNT(*) FROM communes")
    print(f"✅ Built {total} commune geometries")

    await conn.close()


async def main(filepath: str):
    if not DB_URL:
        raise RuntimeError("DATABASE_URL is missing. Check backend/.env")

    await import_parcels(filepath)
    await build_commune_geometries()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to cadastre GeoJSON or GeoJSON.gz file")
    args = parser.parse_args()

    asyncio.run(main(args.file))