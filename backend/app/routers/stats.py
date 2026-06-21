from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_db
from ..services.stats_service import StatsService

router = APIRouter()


@router.get("/{insee_code}")
async def get_commune_stats(insee_code: str, db: AsyncSession = Depends(get_db)):
    service = StatsService(db)
    stats = await service.get_stats(insee_code)

    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found for this commune")

    return stats