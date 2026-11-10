"""CSV import endpoint — parse, preview, and bulk-create transactions."""
from __future__ import annotations
import io
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import Annotated

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.import_record import ImportRecord
from app.models.account import Account
from app.services.transaction_service import create_transaction
from app.schemas.transaction import TransactionCreate

router = APIRouter(prefix="/imports", tags=["imports"])
logger = logging.getLogger(__name__)

DATE_FORMATS = ["%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%d %b %Y", "%Y/%m/%d"]

COLUMN_ALIASES = {
    "date": ["date", "txn_date", "transaction_date", "value_date", "posted_date"],
    "description": ["description", "narration", "particulars", "details", "remarks", "merchant"],
    "amount": ["amount", "debit", "credit", "withdrawal", "deposit", "txn_amount"],
    "type": ["type", "txn_type", "transaction_type", "dr/cr"],
}


def _parse_date(val: str) -> date:
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(val.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: {val!r}")


def _resolve_column(df_cols: list[str], aliases: list[str]) -> str | None:
    lower = {c.lower(): c for c in df_cols}
    for alias in aliases:
        if alias.lower() in lower:
            return lower[alias.lower()]
    return None


def _parse_csv(content: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(content), skipinitialspace=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")
    df.columns = [str(c).strip() for c in df.columns]
    return df


def _map_columns(df: pd.DataFrame) -> dict[str, str]:
    cols = list(df.columns)
    mapping = {}
    for key, aliases in COLUMN_ALIASES.items():
        col = _resolve_column(cols, aliases)
        if col:
            mapping[key] = col
    return mapping


def _build_rows(df: pd.DataFrame, mapping: dict[str, str]) -> list[dict]:
    rows = []
    for idx, row in df.iterrows():
        r: dict = {"row": int(idx) + 2, "error": None}
        try:
            raw_date = str(row.get(mapping.get("date", ""), "")).strip()
            r["txn_date"] = str(_parse_date(raw_date)) if raw_date else None

            r["description"] = str(row.get(mapping.get("description", ""), "")).strip()

            raw_amt = str(row.get(mapping.get("amount", ""), "")).replace(",", "").strip()
            r["amount"] = abs(float(raw_amt)) if raw_amt else None

            raw_type = str(row.get(mapping.get("type", ""), "")).lower().strip()
            if "credit" in raw_type or "cr" in raw_type or "deposit" in raw_type:
                r["txn_type"] = "credit"
            else:
                r["txn_type"] = "debit"

            if not r["txn_date"] or not r["amount"]:
                r["error"] = "Missing required date or amount"
        except Exception as e:
            r["error"] = str(e)

        rows.append(r)
    return rows


@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    account = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    df = _parse_csv(content)
    mapping = _map_columns(df)

    if "date" not in mapping or "amount" not in mapping:
        raise HTTPException(status_code=400, detail="CSV must have date and amount columns")

    rows = _build_rows(df, mapping)
    return {"rows": rows, "total": len(rows), "valid": sum(1 for r in rows if not r["error"])}


@router.post("/")
async def import_csv(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    account = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    df = _parse_csv(content)
    mapping = _map_columns(df)

    if "date" not in mapping or "amount" not in mapping:
        raise HTTPException(status_code=400, detail="CSV must have date and amount columns")

    rows = _build_rows(df, mapping)

    record = ImportRecord(
        user_id=current_user.id,
        file_name=file.filename or "upload.csv",
        total_rows=len(rows),
        status="processing",
    )
    db.add(record)
    db.flush()

    imported = 0
    errors = []
    for r in rows:
        if r["error"]:
            errors.append({"row": r["row"], "error": r["error"]})
            continue
        try:
            txn_data = TransactionCreate(
                account_id=account_id,
                txn_date=r["txn_date"],
                description=r["description"] or "Imported transaction",
                amount=Decimal(str(r["amount"])),
                txn_type=r["txn_type"],
                import_id=record.id,
            )
            create_transaction(db, current_user.id, txn_data)
            imported += 1
        except Exception as e:
            errors.append({"row": r["row"], "error": str(e)})

    record.imported_rows = imported
    record.error_rows = len(errors)
    record.status = "completed"
    db.commit()

    return {
        "import_id": record.id,
        "total_rows": len(rows),
        "imported": imported,
        "failed": len(errors),
        "errors": errors[:20],
    }


@router.get("/")
def list_imports(
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
):
    records = db.query(ImportRecord).filter(ImportRecord.user_id == current_user.id).order_by(ImportRecord.created_at.desc()).limit(20).all()
    return records
