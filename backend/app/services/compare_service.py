from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.stats_repository import StatsRepository


class CompareService:
    def __init__(self, db: AsyncSession):
        self.repository = StatsRepository(db)

    async def compare(self, left: str, right: str):
        left_data = await self.repository.get_stats_by_code(left)
        right_data = await self.repository.get_stats_by_code(right)

        if not left_data or not right_data:
            return None

        left_dict = dict(left_data)
        right_dict = dict(right_data)

        left_price = float(left_dict["avg_price_per_sqm"] or 0)
        right_price = float(right_dict["avg_price_per_sqm"] or 0)

        more_affordable = left if left_price <= right_price else right

        price_difference_pct = 0

        if max(left_price, right_price) > 0:
            price_difference_pct = round(
                abs(left_price - right_price) / max(left_price, right_price) * 100,
                1
            )

        return {
            "left": left_dict,
            "right": right_dict,
            "more_affordable": more_affordable,
            "price_difference_pct": price_difference_pct
        }