from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
from decimal import Decimal

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.transaction import Transaction
    from app.models.user import User


class AccountType(str, enum.Enum):
    SAVINGS = "savings"
    CURRENT = "current"
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    WALLET = "wallet"
    INVESTMENT = "investment"
    OTHER = "other"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(String(20), default="savings")
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))
    color: Mapped[str] = mapped_column(String(7), default="#10B981")
    icon: Mapped[str] = mapped_column(String(50), default="wallet")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    include_in_total: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.account_id", back_populates="account", cascade="all, delete-orphan"
    )
