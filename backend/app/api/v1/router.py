from fastapi import APIRouter
from app.api.v1.endpoints import auth, transactions, accounts, categories, budgets, goals, analytics, ai, alerts
from app.api.v1.endpoints.imports import router as imports_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(transactions.router)
api_router.include_router(accounts.router)
api_router.include_router(categories.router)
api_router.include_router(budgets.router)
api_router.include_router(goals.router)
api_router.include_router(analytics.router)
api_router.include_router(ai.router)
api_router.include_router(alerts.router)
api_router.include_router(imports_router)
