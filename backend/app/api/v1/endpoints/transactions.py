from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut, TransactionListResponse
from app.services import transaction_service
from app.models.user import User
import datetime
import csv
import io

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    month: str | None = None,
    category_id: int | None = None,
    account_id: int | None = None,
    txn_type: str | None = None,
    search: str | None = None,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.list_transactions(
        db, current_user.id, page, page_size,
        month, category_id, account_id, txn_type, search, start_date, end_date,
    )


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.create_transaction(db, current_user.id, data)


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = transaction_service.get_transaction_or_404(db, current_user.id, txn_id)
    return transaction_service._enrich(txn)


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(
    txn_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.update_transaction(db, current_user.id, txn_id, data)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction_service.delete_transaction(db, current_user.id, txn_id)


@router.get("/export")
def export_transactions(
    month: str | None = None,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = transaction_service.list_transactions(
        db, current_user.id, page=1, page_size=10000,
        month=month, start_date=start_date, end_date=end_date,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Merchant", "Amount", "Type", "Category", "Account", "Notes"])
    for t in result.items:
        writer.writerow([
            t.txn_date, t.description, t.merchant or "",
            float(t.amount), t.txn_type,
            t.category_name or "", t.account_name or "", t.notes or "",
        ])
    output.seek(0)
    filename = f"transactions_{month or 'all'}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
