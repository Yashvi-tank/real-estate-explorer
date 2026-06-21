import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class CommuneRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(text("""
            SELECT
                c.insee_code,
                c.name,
                cs.avg_price_per_sqm,
                cs.transaction_count
            FROM communes c
            LEFT JOIN commune_stats cs
                ON c.insee_code = cs.commune_insee_code
            ORDER BY c.name
        """))
        return result.mappings().all()

    async def get_by_code(self, insee_code: str):
        result = await self.db.execute(text("""
            SELECT
                c.insee_code,
                c.name,
                cs.transaction_count,
                cs.avg_price,
                cs.median_price,
                cs.avg_surface,
                cs.avg_price_per_sqm,
                cs.median_price_per_sqm,
                cs.min_price_per_sqm,
                cs.max_price_per_sqm
            FROM communes c
            LEFT JOIN commune_stats cs
                ON c.insee_code = cs.commune_insee_code
            WHERE c.insee_code = :code
        """), {"code": insee_code})

        return result.mappings().first()

    async def get_geojson(self):
        result = await self.db.execute(text("""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(c.geom)::json,
                        'properties', json_build_object(
                            'insee_code', c.insee_code,
                            'name', c.name,
                            'avg_price_per_sqm', cs.avg_price_per_sqm,
                            'median_price_per_sqm', cs.median_price_per_sqm,
                            'transaction_count', cs.transaction_count,
                            'avg_price', cs.avg_price
                        )
                    )
                )
            )::text AS geojson
            FROM communes c
            LEFT JOIN commune_stats cs
                ON c.insee_code = cs.commune_insee_code
            WHERE c.geom IS NOT NULL
        """))

        row = result.mappings().first()

        if not row or not row["geojson"]:
            return {
                "type": "FeatureCollection",
                "features": []
            }

        return json.loads(row["geojson"])