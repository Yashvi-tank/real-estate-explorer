from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.commune_repository import CommuneRepository


class CommuneService:
    def __init__(self, db: AsyncSession):
        self.repository = CommuneRepository(db)

    async def list_communes(self):
        communes = await self.repository.get_all()
        return [dict(c) for c in communes]

    async def get_commune(self, insee_code: str):
        commune = await self.repository.get_by_code(insee_code)
        return dict(commune) if commune else None

    async def get_geojson(self):
        return await self.repository.get_geojson()