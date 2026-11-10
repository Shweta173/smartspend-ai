from sqlalchemy.orm import Session
from app.models.goal import SavingsGoal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut
from fastapi import HTTPException
from decimal import Decimal
import datetime


def _enrich(goal: SavingsGoal) -> GoalOut:
    out = GoalOut.model_validate(goal)
    out.remaining_amount = max(goal.target_amount - goal.current_amount, Decimal("0"))
    out.progress_percent = float(
        min(goal.current_amount / goal.target_amount * 100, 100)
    ) if goal.target_amount > 0 else 0.0

    if goal.target_date and not goal.is_completed:
        today = datetime.date.today()
        days_left = (goal.target_date - today).days
        months_left = max(days_left / 30, 0.5)
        if out.remaining_amount > 0:
            out.suggested_monthly = Decimal(str(out.remaining_amount / Decimal(str(months_left)))).quantize(Decimal("0.01"))
            out.months_to_goal = round(months_left, 1)
    return out


def list_goals(db: Session, user_id: int) -> list[GoalOut]:
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    return [_enrich(g) for g in goals]


def create_goal(db: Session, user_id: int, data: GoalCreate) -> GoalOut:
    goal = SavingsGoal(user_id=user_id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


def update_goal(db: Session, user_id: int, goal_id: int, data: GoalUpdate) -> GoalOut:
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(goal, k, v)
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


def delete_goal(db: Session, user_id: int, goal_id: int) -> None:
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


def deposit(db: Session, user_id: int, goal_id: int, amount: Decimal) -> GoalOut:
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.current_amount = Decimal(str(goal.current_amount)) + amount
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    db.commit()
    db.refresh(goal)
    return _enrich(goal)
