from pydantic import BaseModel
from decimal import Decimal
import datetime


class AccountCreate(BaseModel):
    name: str
    account_type: str = "savings"
    currency: str = "INR"
    balance: Decimal = Decimal("0.00")
    color: str = "#10B981"
    icon: str = "wallet"
    notes: str | None = None
    include_in_total: bool = True


class AccountUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None
    notes: str | None = None
    include_in_total: bool | None = None
    is_active: bool | None = None


class AccountOut(BaseModel):
    id: int
    name: str
    account_type: str
    currency: str
    balance: Decimal
    color: str
    icon: str
    is_active: bool
    include_in_total: bool
    notes: str | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
