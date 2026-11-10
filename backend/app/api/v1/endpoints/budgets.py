from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut
from app.services import budget_service
from app.models.user import User

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
def list_budgets(month: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return budget_service.list_budgets(db, current_user.id, month)


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return budget_service.create_budget(db, current_user.id, data)


@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, data: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return budget_service.update_budget(db, current_user.id, budget_id, data)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget_service.delete_budget(db, current_user.id, budget_id)
