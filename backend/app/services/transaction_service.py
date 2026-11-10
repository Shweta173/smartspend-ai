from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.models.budget import Budget
from app.models.alert import Alert
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut, TransactionListResponse
from app.services.category_service import get_category_by_rule
from app.ml.anomaly import detect_anomaly
from fastapi import HTTPException
from decimal import Decimal
import datetime
import calendar


def _enrich(txn: Transaction) -> TransactionOut:
    out = TransactionOut.model_validate(txn)
    if txn.category:
        out.category_name = txn.category.name
        out.category_color = txn.category.color
        out.category_icon = txn.category.icon
    if txn.account:
        out.account_name = txn.account.name
    return out


def list_transactions(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    month: str | None = None,
    category_id: int | None = None,
    account_id: int | None = None,
    txn_type: str | None = None,
    search: str | None = None,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
) -> TransactionListResponse:
    q = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.txn_date.desc(), Transaction.id.desc())
    )
    if month:
        year, mon = int(month[:4]), int(month[5:7])
        q = q.filter(
            extract("year", Transaction.txn_date) == year,
            extract("month", Transaction.txn_date) == mon,
        )
    if start_date:
        q = q.filter(Transaction.txn_date >= start_date)
    if end_date:
        q = q.filter(Transaction.txn_date <= end_date)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if txn_type:
        q = q.filter(Transaction.txn_type == txn_type)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Transaction.description.ilike(like)) | (Transaction.merchant.ilike(like))
        )

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return TransactionListResponse(
        items=[_enrich(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


def _run_anomaly_check(db: Session, user_id: int, txn: Transaction) -> None:
    """Check for anomaly and update txn in-place. No commit."""
    if txn.txn_type != "debit" or not txn.category_id:
        return
    # Fetch historical amounts for this category (excluding the new txn itself)
    amounts = [
        float(r[0])
        for r in db.query(Transaction.amount).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == txn.category_id,
            Transaction.txn_type == "debit",
            Transaction.id != txn.id,
        ).all()
    ]
    is_anom, score, reason = detect_anomaly(float(txn.amount), txn.category_id, amounts)
    if is_anom:
        txn.is_anomaly = True
        txn.anomaly_score = score
        txn.anomaly_reason = reason
        db.add(Alert(
            user_id=user_id,
            alert_type="anomaly",
            message=f"Unusual transaction: {txn.description} — {reason}",
            transaction_id=txn.id,
        ))


def _check_budget_alert(db: Session, user_id: int, txn: Transaction) -> None:
    """Create a budget alert if spending crosses the alert threshold. No commit."""
    if txn.txn_type != "debit" or not txn.category_id:
        return
    today = txn.txn_date
    month_start = datetime.date(today.year, today.month, 1)
    month_end = datetime.date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category_id == txn.category_id,
        Budget.is_active == True,
        Budget.month >= month_start,
        Budget.month <= month_end,
    ).first()

    if not budget:
        return

    spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.category_id == txn.category_id,
        Transaction.txn_type == "debit",
        Transaction.txn_date >= month_start,
        Transaction.txn_date <= month_end,
    ).scalar() or Decimal("0")
    spent = Decimal(str(spent))

    limit = budget.limit_amount
    if limit <= 0:
        return

    pct = float(spent / limit * 100)
    threshold = budget.alert_at_percent

    cat = txn.category
    cat_name = cat.name if cat else "category"

    # Suppress duplicate alerts: only one alert per category per month per threshold level
    alert_key = f"budget:{txn.category_id}:{today.year}-{today.month:02d}"
    already_alerted = db.query(Alert).filter(
        Alert.user_id == user_id,
        Alert.alert_type == "budget",
        Alert.message.contains(alert_key),
    ).first()

    if already_alerted:
        return

    if pct >= 100:
        db.add(Alert(
            user_id=user_id,
            alert_type="budget",
            message=f"Budget exceeded for {cat_name}! Spent ₹{float(spent):,.0f} of ₹{float(limit):,.0f} limit. [{alert_key}]",
        ))
    elif pct >= threshold:
        db.add(Alert(
            user_id=user_id,
            alert_type="budget",
            message=f"{cat_name} budget at {pct:.0f}%: ₹{float(spent):,.0f} of ₹{float(limit):,.0f}. [{alert_key}]",
        ))


def create_transaction(db: Session, user_id: int, data: TransactionCreate) -> TransactionOut:
    # Auto-categorize via rules if no category provided
    category_id = data.category_id
    category_source = "user" if category_id else "rule"
    if not category_id:
        cats = db.query(Category).filter(Category.user_id == user_id).all()
        matched = get_category_by_rule(data.description, cats)
        if matched:
            category_id = matched.id
        else:
            # Try ML categorizer
            from app.ml.categorizer import get_categorizer
            labeled = db.query(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.category_id != None,
                Transaction.category_source == "user",
            ).limit(500).all()
            if len(labeled) >= 20:
                cat_obj = get_categorizer()
                cat_obj.train(
                    [t.description for t in labeled],
                    [t.category_id for t in labeled],
                )
                result = cat_obj.predict(data.description)
                if result:
                    category_id, _ = result
                    category_source = "ml"

    txn = Transaction(
        user_id=user_id,
        account_id=data.account_id,
        category_id=category_id,
        txn_date=data.txn_date,
        description=data.description,
        merchant=data.merchant,
        amount=data.amount,
        txn_type=data.txn_type,
        to_account_id=data.to_account_id,
        notes=data.notes,
        import_id=data.import_id,
        category_source=category_source,
    )
    db.add(txn)

    # Update account balance
    if data.account_id:
        acct = db.query(Account).filter(Account.id == data.account_id, Account.user_id == user_id).first()
        if acct:
            if data.txn_type == "credit":
                acct.balance = Decimal(str(acct.balance)) + data.amount
            elif data.txn_type == "debit":
                acct.balance = Decimal(str(acct.balance)) - data.amount

    db.flush()  # get txn.id before anomaly/budget checks

    # Anomaly detection + budget alerts (never break the main flow)
    try:
        _run_anomaly_check(db, user_id, txn)
        _check_budget_alert(db, user_id, txn)
    except Exception:
        pass

    db.commit()
    db.refresh(txn)
    return _enrich(txn)


def get_transaction_or_404(db: Session, user_id: int, txn_id: int) -> Transaction:
    txn = db.query(Transaction).filter(Transaction.id == txn_id, Transaction.user_id == user_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


def update_transaction(db: Session, user_id: int, txn_id: int, data: TransactionUpdate) -> TransactionOut:
    txn = get_transaction_or_404(db, user_id, txn_id)
    updates = data.model_dump(exclude_none=True)
    if "category_id" in updates:
        txn.category_source = "user"
    for k, v in updates.items():
        setattr(txn, k, v)
    db.commit()
    db.refresh(txn)
    return _enrich(txn)


def delete_transaction(db: Session, user_id: int, txn_id: int) -> None:
    txn = get_transaction_or_404(db, user_id, txn_id)
    # Reverse balance
    if txn.account_id:
        acct = db.query(Account).filter(Account.id == txn.account_id).first()
        if acct:
            if txn.txn_type == "credit":
                acct.balance = Decimal(str(acct.balance)) - txn.amount
            elif txn.txn_type == "debit":
                acct.balance = Decimal(str(acct.balance)) + txn.amount
    db.delete(txn)
    db.commit()
