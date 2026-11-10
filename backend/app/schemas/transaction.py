from pydantic import BaseModel, field_validator
from decimal import Decimal
import datetime


class TransactionCreate(BaseModel):
    account_id: int | None = None
    category_id: int | None = None
    txn_date: datetime.date
    description: str
    merchant: str | None = None
    amount: Decimal
    txn_type: str  # debit | credit | transfer
    to_account_id: int | None = None
    notes: str | None = None
    import_id: int | None = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("txn_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in ("debit", "credit", "transfer"):
            raise ValueError("txn_type must be debit, credit, or transfer")
        return v


class TransactionUpdate(BaseModel):
    account_id: int | None = None
    category_id: int | None = None
    txn_date: datetime.date | None = None
    description: str | None = None
    merchant: str | None = None
    amount: Decimal | None = None
    txn_type: str | None = None
    notes: str | None = None


class TransactionOut(BaseModel):
    id: int
    account_id: int | None
    category_id: int | None
    txn_date: datetime.date
    description: str
    merchant: str | None
    amount: Decimal
    txn_type: str
    notes: str | None
    category_source: str
    is_anomaly: bool
    anomaly_score: float | None
    anomaly_reason: str | None
    created_at: datetime.datetime

    # Joined
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    account_name: str | None = None

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int
