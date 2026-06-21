import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_URL = os.getenv("DATABASE_URL")
print("Using DB:", DB_URL)


async def build_commune_geometries():
    conn = await asyncpg.connect(DB_URL)

    print("Clearing communes table...")
    await conn.execute("TRUNCATE TABLE communes")

    commune_codes = await conn.fetch("""
        SELECT DISTINCT commune_code
        FROM parcels
        ORDER BY commune_code
    """)

    print(f"Found {len(commune_codes)} communes")

    for row in commune_codes:
        code = row["commune_code"]

        try:
            await conn.execute("""
                INSERT INTO communes (insee_code, name, geom, bbox)
                WITH fixed AS (
                    SELECT
                        ST_Buffer(
                            ST_CollectionExtract(
                                ST_MakeValid(geom),
                                3
                            ),
                            0
                        ) AS geom
                    FROM parcels
                    WHERE commune_code = $1
                      AND geom IS NOT NULL
                ),
                merged AS (
                    SELECT
                        ST_Multi(
                            ST_SimplifyPreserveTopology(
                                ST_CollectionExtract(
                                    ST_Union(geom),
                                    3
                                ),
                                0.00005
                            )
                        ) AS geom
                    FROM fixed
                    WHERE NOT ST_IsEmpty(geom)
                )
                SELECT
                    $1,
                    $1,
                    geom,
                    ST_AsGeoJSON(ST_Envelope(geom))::jsonb
                FROM merged
                WHERE geom IS NOT NULL
            """, code)

            print(f"✅ Built geometry for commune {code}")

        except Exception as e:
            print(f"❌ Failed commune {code}: {e}")

    total = await conn.fetchval("SELECT COUNT(*) FROM communes")
    print(f"✅ Built {total} commune geometries")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(build_commune_geometries())