from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_db
from ..services.stats_service import StatsService

router = APIRouter()


@router.get("")
async def get_rankings(
    metric: str = Query(default="avg_price_per_sqm"),
    order: str = Query(default="asc"),
    limit: int = Query(default=10, ge=1, le=47),
    db: AsyncSession = Depends(get_db)
):
    service = StatsService(db)
    return await service.get_rankings(metric, order, limit)