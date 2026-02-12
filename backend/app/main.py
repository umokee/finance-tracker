from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, async_session
from .seed import seed_all
from .routers import categories, transactions, goals, budgets, recurring, analytics, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as db:
        await seed_all(db)
    yield


app = FastAPI(
    title="Finance Tracker API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(recurring.router, prefix="/api/recurring", tags=["recurring"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
