import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_URL = os.getenv("DATABASE_URL")
print("Using DB:", DB_URL)


CLEAN_GEOMETRY_QUERY = """
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
            ST_CollectionExtract(
                ST_MakeValid(
                    ST_SimplifyPreserveTopology(
                        ST_Buffer(
                            ST_Buffer(
                                ST_Union(geom),
                                0.00018
                            ),
                            -0.00018
                        ),
                        0.00008
                    )
                ),
                3
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
"""


FALLBACK_GEOMETRY_QUERY = """
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
"""


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
            await conn.execute(CLEAN_GEOMETRY_QUERY, code)
            print(f"✅ Built clean geometry for commune {code}")

        except Exception as clean_error:
            print(f"⚠️ Clean geometry failed for {code}. Using fallback geometry.")

            try:
                await conn.execute(FALLBACK_GEOMETRY_QUERY, code)
                print(f"✅ Built fallback geometry for commune {code}")

            except Exception as fallback_error:
                print(f"❌ Failed commune {code}: {fallback_error}")

    total = await conn.fetchval("SELECT COUNT(*) FROM communes")
    print(f"✅ Built {total} commune geometries")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(build_commune_geometries())