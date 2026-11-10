from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.models.alert import Alert
from decimal import Decimal
import datetime
import calendar


def get_month_range(month: str) -> tuple[datetime.date, datetime.date]:
    year, mon = int(month[:4]), int(month[5:7])
    start = datetime.date(year, mon, 1)
    end = datetime.date(year, mon, calendar.monthrange(year, mon)[1])
    return start, end


def get_summary(db: Session, user_id: int, month: str) -> dict:
    start, end = get_month_range(month)

    rows = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.txn_date >= start,
            Transaction.txn_date <= end,
        )
        .all()
    )

    income = sum(t.amount for t in rows if t.txn_type == "credit")
    expenses = sum(t.amount for t in rows if t.txn_type == "debit")
    income = Decimal(str(income))
    expenses = Decimal(str(expenses))
    savings = income - expenses
    savings_rate = float((savings / income * 100).quantize(Decimal("0.01"))) if income > 0 else 0.0

    # Category breakdown
    cat_totals: dict[int | None, Decimal] = {}
    cat_counts: dict[int | None, int] = {}
    for t in rows:
        if t.txn_type == "debit":
            cat_totals[t.category_id] = cat_totals.get(t.category_id, Decimal("0")) + t.amount
            cat_counts[t.category_id] = cat_counts.get(t.category_id, 0) + 1

    top_cats = []
    for cat_id, total in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:6]:
        cat = db.query(Category).filter(Category.id == cat_id).first() if cat_id else None
        top_cats.append({
            "category_id": cat_id,
            "category_name": cat.name if cat else "Uncategorized",
            "category_color": cat.color if cat else "#94A3B8",
            "category_icon": cat.icon if cat else "circle",
            "total": float(total),
            "count": cat_counts[cat_id],
            "percent": float(total / expenses * 100) if expenses > 0 else 0.0,
        })

    # Total balance
    accounts = db.query(Account).filter(Account.user_id == user_id, Account.include_in_total == True).all()
    total_balance = sum(Decimal(str(a.balance)) for a in accounts)

    # Recent transactions
    recent = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.txn_date.desc(), Transaction.id.desc())
        .limit(5)
        .all()
    )
    recent_out = []
    for t in recent:
        cat = t.category
        recent_out.append({
            "id": t.id,
            "description": t.description,
            "merchant": t.merchant,
            "amount": float(t.amount),
            "txn_type": t.txn_type,
            "txn_date": t.txn_date.isoformat(),
            "category_name": cat.name if cat else "Uncategorized",
            "category_color": cat.color if cat else "#94A3B8",
            "category_icon": cat.icon if cat else "circle",
        })

    # Alerts
    unread_alerts = db.query(func.count(Alert.id)).filter(
        Alert.user_id == user_id, Alert.is_read == False
    ).scalar() or 0

    anomaly_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == user_id,
        Transaction.is_anomaly == True,
        Transaction.txn_date >= start,
        Transaction.txn_date <= end,
    ).scalar() or 0

    return {
        "month": month,
        "total_income": float(income),
        "total_expenses": float(expenses),
        "net_savings": float(savings),
        "savings_rate": savings_rate,
        "total_balance": float(total_balance),
        "top_categories": top_cats,
        "anomaly_count": anomaly_count,
        "unread_alerts": unread_alerts,
        "recent_transactions": recent_out,
    }


def get_monthly_trend(db: Session, user_id: int, months: int = 6) -> list[dict]:
    today = datetime.date.today()
    result = []
    for i in range(months - 1, -1, -1):
        # Go back i months
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        start = datetime.date(y, m, 1)
        end = datetime.date(y, m, calendar.monthrange(y, m)[1])
        rows = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.txn_date >= start,
            Transaction.txn_date <= end,
        ).all()
        income = Decimal(str(sum(t.amount for t in rows if t.txn_type == "credit") or 0))
        expenses = Decimal(str(sum(t.amount for t in rows if t.txn_type == "debit") or 0))
        savings = income - expenses
        result.append({
            "month": f"{y}-{m:02d}",
            "income": float(income),
            "expenses": float(expenses),
            "savings": float(savings),
            "savings_rate": float((savings / income * 100)) if income > 0 else 0.0,
        })
    return result


def get_forecast(db: Session, user_id: int) -> dict:
    """Linear forecast for next month based on last 3 months of spend/income."""
    trend = get_monthly_trend(db, user_id, months=4)
    if len(trend) < 2:
        return {"forecast_income": 0.0, "forecast_expenses": 0.0, "forecast_savings": 0.0, "confidence": "low"}

    # Simple average of last 3 months
    recent = trend[-3:] if len(trend) >= 3 else trend
    avg_income = sum(m["income"] for m in recent) / len(recent)
    avg_expenses = sum(m["expenses"] for m in recent) / len(recent)

    # Linear trend (last vs first of recent window)
    if len(recent) >= 2:
        inc_slope = (recent[-1]["income"] - recent[0]["income"]) / max(len(recent) - 1, 1)
        exp_slope = (recent[-1]["expenses"] - recent[0]["expenses"]) / max(len(recent) - 1, 1)
        forecast_income = max(avg_income + inc_slope, 0.0)
        forecast_expenses = max(avg_expenses + exp_slope, 0.0)
    else:
        forecast_income = avg_income
        forecast_expenses = avg_expenses

    today = datetime.date.today()
    next_month_num = today.month % 12 + 1
    next_month_year = today.year + (1 if today.month == 12 else 0)
    next_month = f"{next_month_year}-{next_month_num:02d}"

    return {
        "forecast_month": next_month,
        "forecast_income": round(forecast_income, 2),
        "forecast_expenses": round(forecast_expenses, 2),
        "forecast_savings": round(forecast_income - forecast_expenses, 2),
        "confidence": "medium" if len(trend) >= 3 else "low",
        "based_on_months": len(recent),
    }


def get_category_breakdown(db: Session, user_id: int, month: str) -> list[dict]:
    start, end = get_month_range(month)
    rows = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.txn_date >= start,
        Transaction.txn_date <= end,
        Transaction.txn_type == "debit",
    ).all()
    total_expenses = sum(t.amount for t in rows) or Decimal("0")
    cat_totals: dict = {}
    for t in rows:
        key = t.category_id
        if key not in cat_totals:
            cat = t.category
            cat_totals[key] = {
                "category_id": key,
                "category_name": cat.name if cat else "Uncategorized",
                "category_color": cat.color if cat else "#94A3B8",
                "category_icon": cat.icon if cat else "circle",
                "total": Decimal("0"),
                "count": 0,
            }
        cat_totals[key]["total"] += t.amount
        cat_totals[key]["count"] += 1
    result = []
    for item in sorted(cat_totals.values(), key=lambda x: x["total"], reverse=True):
        item["percent"] = float(item["total"] / total_expenses * 100) if total_expenses > 0 else 0.0
        item["total"] = float(item["total"])
        result.append(item)
    return result
