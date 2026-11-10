from sqlalchemy import String, Numeric, Date, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from decimal import Decimal
import datetime

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.alert import Alert
    from app.models.category import Category
    from app.models.user import User


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    to_account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    import_id: Mapped[int | None] = mapped_column(ForeignKey("import_records.id", ondelete="SET NULL"), nullable=True)

    txn_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    merchant: Mapped[str | None] = mapped_column(String(200), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    txn_type: Mapped[str] = mapped_column(String(10), nullable=False)  # debit | credit | transfer
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ML / AI fields
    category_source: Mapped[str] = mapped_column(String(10), default="user")  # rule | ml | llm | user
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    anomaly_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="transactions")
    account: Mapped["Account | None"] = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    category: Mapped["Category | None"] = relationship("Category", back_populates="transactions")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="transaction", cascade="all, delete-orphan")
