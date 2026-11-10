from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountUpdate
from fastapi import HTTPException
from decimal import Decimal


def seed_default_accounts(db: Session, user_id: int) -> None:
    defaults = [
        Account(user_id=user_id, name="Savings Account", account_type="savings", color="#10B981", icon="landmark", balance=Decimal("0.00")),
        Account(user_id=user_id, name="Cash Wallet", account_type="cash", color="#F59E0B", icon="wallet", balance=Decimal("0.00")),
    ]
    for acct in defaults:
        db.add(acct)
    db.commit()


def list_accounts(db: Session, user_id: int) -> list[Account]:
    return db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()


def create_account(db: Session, user_id: int, data: AccountCreate) -> Account:
    acct = Account(user_id=user_id, **data.model_dump())
    db.add(acct)
    db.commit()
    db.refresh(acct)
    return acct


def get_account_or_404(db: Session, user_id: int, account_id: int) -> Account:
    acct = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")
    return acct


def update_account(db: Session, user_id: int, account_id: int, data: AccountUpdate) -> Account:
    acct = get_account_or_404(db, user_id, account_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(acct, key, value)
    db.commit()
    db.refresh(acct)
    return acct


def delete_account(db: Session, user_id: int, account_id: int) -> None:
    acct = get_account_or_404(db, user_id, account_id)
    acct.is_active = False
    db.commit()


def recalculate_balance(db: Session, account_id: int) -> Decimal:
    credits = db.query(func.sum(Transaction.amount)).filter(
        Transaction.account_id == account_id,
        Transaction.txn_type == "credit",
    ).scalar() or Decimal("0.00")
    debits = db.query(func.sum(Transaction.amount)).filter(
        Transaction.account_id == account_id,
        Transaction.txn_type == "debit",
    ).scalar() or Decimal("0.00")
    return Decimal(str(credits)) - Decimal(str(debits))
