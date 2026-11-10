from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut
from fastapi import HTTPException
from decimal import Decimal
import datetime
import calendar


def list_budgets(db: Session, user_id: int, month: str | None = None) -> list[BudgetOut]:
    q = db.query(Budget).filter(Budget.user_id == user_id, Budget.is_active == True)
    if month:
        year, mon = int(month[:4]), int(month[5:7])
        q = q.filter(
            extract("year", Budget.month) == year,
            extract("month", Budget.month) == mon,
        )
    budgets = q.all()
    return [_enrich_budget(db, user_id, b, month) for b in budgets]


def _enrich_budget(db: Session, user_id: int, budget: Budget, month: str | None) -> BudgetOut:
    mon = month or budget.month.strftime("%Y-%m")
    year, m = int(mon[:4]), int(mon[5:7])
    start = datetime.date(year, m, 1)
    end = datetime.date(year, m, calendar.monthrange(year, m)[1])

    spent_q = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.txn_type == "debit",
        Transaction.txn_date >= start,
        Transaction.txn_date <= end,
    )
    if budget.category_id:
        spent_q = spent_q.filter(Transaction.category_id == budget.category_id)
    spent = Decimal(str(spent_q.scalar() or 0))
    limit = budget.limit_amount
    remaining = max(limit - spent, Decimal("0"))
    percent = float(spent / limit * 100) if limit > 0 else 0.0

    out = BudgetOut.model_validate(budget)
    out.spent_amount = spent
    out.remaining_amount = remaining
    out.percent_used = round(percent, 1)
    if budget.category:
        out.category_name = budget.category.name
        out.category_color = budget.category.color
        out.category_icon = budget.category.icon
    return out


def create_budget(db: Session, user_id: int, data: BudgetCreate) -> BudgetOut:
    budget = Budget(user_id=user_id, **data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _enrich_budget(db, user_id, budget, data.month.strftime("%Y-%m"))


def update_budget(db: Session, user_id: int, budget_id: int, data: BudgetUpdate) -> BudgetOut:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(budget, k, v)
    db.commit()
    db.refresh(budget)
    return _enrich_budget(db, user_id, budget, None)


def delete_budget(db: Session, user_id: int, budget_id: int) -> None:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
