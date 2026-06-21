from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class StatsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats_by_code(self, insee_code: str):
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
            FROM commune_stats cs
            JOIN communes c
                ON c.insee_code = cs.commune_insee_code
            WHERE cs.commune_insee_code = :code
        """), {"code": insee_code})

        return result.mappings().first()

    async def get_rankings(
        self,
        metric: str = "avg_price_per_sqm",
        order: str = "asc",
        limit: int = 10
    ):
        allowed_metrics = {
            "avg_price_per_sqm",
            "median_price_per_sqm",
            "avg_price",
            "transaction_count"
        }

        allowed_orders = {"asc", "desc"}

        if metric not in allowed_metrics:
            metric = "avg_price_per_sqm"

        if order.lower() not in allowed_orders:
            order = "asc"

        order = order.lower()

        result = await self.db.execute(text(f"""
            SELECT
                c.insee_code,
                c.name,
                cs.transaction_count,
                cs.avg_price,
                cs.median_price,
                cs.avg_surface,
                cs.avg_price_per_sqm,
                cs.median_price_per_sqm
            FROM commune_stats cs
            JOIN communes c
                ON c.insee_code = cs.commune_insee_code
            WHERE cs.{metric} IS NOT NULL
            ORDER BY cs.{metric} {order}
            LIMIT :limit
        """), {"limit": limit})

        return result.mappings().all()