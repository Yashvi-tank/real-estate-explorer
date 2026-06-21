from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_db
from ..services.compare_service import CompareService

router = APIRouter()


@router.get("")
async def compare_communes(
    left: str = Query(..., description="INSEE code of first commune"),
    right: str = Query(..., description="INSEE code of second commune"),
    db: AsyncSession = Depends(get_db)
):
    service = CompareService(db)
    comparison = await service.compare(left, right)

    if not comparison:
        raise HTTPException(status_code=404, detail="One or both communes not found")

    return comparison