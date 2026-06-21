import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_URL = os.getenv("DATABASE_URL")
print("Using DB:", DB_URL)

CREATE_TABLES = """
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS parcels (
    id TEXT PRIMARY KEY,
    commune_code TEXT NOT NULL,
    section TEXT,
    numero TEXT,
    contenance NUMERIC,
    geom GEOMETRY(Polygon, 4326),
    raw_properties JSONB
);

CREATE INDEX IF NOT EXISTS idx_parcels_commune ON parcels(commune_code);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST(geom);

CREATE TABLE IF NOT EXISTS communes (
    insee_code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    bbox JSONB
);

CREATE INDEX IF NOT EXISTS idx_communes_geom ON communes USING GIST(geom);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT,
    date_mutation DATE,
    price NUMERIC,
    surface_reelle_bati NUMERIC,
    price_per_sqm NUMERIC,
    commune_insee_code TEXT,
    type_local TEXT,
    raw_data JSONB,
    PRIMARY KEY (transaction_id, commune_insee_code)
);

CREATE INDEX IF NOT EXISTS idx_transactions_commune ON transactions(commune_insee_code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date_mutation);

CREATE TABLE IF NOT EXISTS commune_stats (
    commune_insee_code TEXT PRIMARY KEY,
    transaction_count INTEGER,
    avg_price NUMERIC,
    median_price NUMERIC,
    avg_surface NUMERIC,
    avg_price_per_sqm NUMERIC,
    median_price_per_sqm NUMERIC,
    min_price_per_sqm NUMERIC,
    max_price_per_sqm NUMERIC,
    updated_at TIMESTAMP DEFAULT NOW()
);
"""

async def create_tables():
    if not DB_URL:
        raise RuntimeError("DATABASE_URL is missing. Check backend/.env")

    url = DB_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)
    await conn.execute(CREATE_TABLES)
    await conn.close()
    print("✅ Tables created successfully")

if __name__ == "__main__":
    asyncio.run(create_tables())