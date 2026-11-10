from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut
from app.services import goal_service
from app.models.user import User

router = APIRouter(prefix="/goals", tags=["goals"])


class DepositRequest(BaseModel):
    amount: Decimal


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return goal_service.list_goals(db, current_user.id)


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(data: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return goal_service.create_goal(db, current_user.id, data)


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return goal_service.update_goal(db, current_user.id, goal_id, data)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal_service.delete_goal(db, current_user.id, goal_id)


@router.post("/{goal_id}/deposit", response_model=GoalOut)
def deposit_to_goal(goal_id: int, data: DepositRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return goal_service.deposit(db, current_user.id, goal_id, data.amount)
