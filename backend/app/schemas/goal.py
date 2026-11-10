from pydantic import BaseModel
from decimal import Decimal
import datetime


class GoalCreate(BaseModel):
    name: str
    description: str | None = None
    target_amount: Decimal
    current_amount: Decimal = Decimal("0.00")
    target_date: datetime.date | None = None
    icon: str = "target"
    color: str = "#8B5CF6"


class GoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: Decimal | None = None
    current_amount: Decimal | None = None
    target_date: datetime.date | None = None
    icon: str | None = None
    color: str | None = None
    is_completed: bool | None = None


class GoalOut(BaseModel):
    id: int
    name: str
    description: str | None
    target_amount: Decimal
    current_amount: Decimal
    target_date: datetime.date | None
    icon: str
    color: str
    is_completed: bool
    progress_percent: float = 0.0
    remaining_amount: Decimal = Decimal("0.00")
    months_to_goal: float | None = None
    suggested_monthly: Decimal | None = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
