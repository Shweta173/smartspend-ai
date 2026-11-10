from pydantic import BaseModel
from decimal import Decimal
import datetime


class BudgetCreate(BaseModel):
    category_id: int | None = None
    month: datetime.date
    limit_amount: Decimal
    alert_at_percent: int = 80


class BudgetUpdate(BaseModel):
    limit_amount: Decimal | None = None
    alert_at_percent: int | None = None
    is_active: bool | None = None


class BudgetOut(BaseModel):
    id: int
    category_id: int | None
    month: datetime.date
    limit_amount: Decimal
    alert_at_percent: int
    is_active: bool
    # Computed at query time
    spent_amount: Decimal = Decimal("0.00")
    remaining_amount: Decimal = Decimal("0.00")
    percent_used: float = 0.0
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None

    model_config = {"from_attributes": True}
