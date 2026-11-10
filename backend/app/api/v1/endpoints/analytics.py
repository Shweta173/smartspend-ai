from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.services import analytics_service
from app.models.user import User
import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mon = month or datetime.date.today().strftime("%Y-%m")
    summary = analytics_service.get_summary(db, current_user.id, mon)
    summary["monthly_trend"] = analytics_service.get_monthly_trend(db, current_user.id, 6)
    return summary


@router.get("/monthly")
def monthly_trend(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_monthly_trend(db, current_user.id, months)


@router.get("/categories")
def category_breakdown(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mon = month or datetime.date.today().strftime("%Y-%m")
    return analytics_service.get_category_breakdown(db, current_user.id, mon)


@router.get("/summary")
def summary(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mon = month or datetime.date.today().strftime("%Y-%m")
    return analytics_service.get_summary(db, current_user.id, mon)


@router.get("/forecast")
def forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_forecast(db, current_user.id)
