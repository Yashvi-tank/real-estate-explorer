from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_db
from ..services.commune_service import CommuneService

router = APIRouter()


@router.get("")
async def list_communes(db: AsyncSession = Depends(get_db)):
    service = CommuneService(db)
    return await service.list_communes()


@router.get("/geojson")
async def communes_geojson(db: AsyncSession = Depends(get_db)):
    service = CommuneService(db)
    geojson = await service.get_geojson()
    return JSONResponse(content=geojson)


@router.get("/{insee_code}")
async def get_commune(insee_code: str, db: AsyncSession = Depends(get_db)):
    service = CommuneService(db)
    commune = await service.get_commune(insee_code)

    if not commune:
        raise HTTPException(status_code=404, detail="Commune not found")

    return commune