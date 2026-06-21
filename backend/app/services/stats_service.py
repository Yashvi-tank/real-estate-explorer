from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.stats_repository import StatsRepository


class StatsService:
    def __init__(self, db: AsyncSession):
        self.repository = StatsRepository(db)

    async def get_stats(self, insee_code: str):
        stats = await self.repository.get_stats_by_code(insee_code)
        return dict(stats) if stats else None

    async def get_rankings(self, metric: str, order: str, limit: int):
        rankings = await self.repository.get_rankings(metric, order, limit)
        return [dict(r) for r in rankings]