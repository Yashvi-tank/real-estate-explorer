from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import health, communes, stats, compare, rankings

app = FastAPI(title="Val-de-Marne Real Estate API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(communes.router, prefix="/communes", tags=["communes"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(compare.router, prefix="/compare", tags=["compare"])
app.include_router(rankings.router, prefix="/rankings", tags=["rankings"])


@app.get("/")
async def root():
    return {
        "message": "Val-de-Marne Real Estate API v2",
        "status": "ok"
    }