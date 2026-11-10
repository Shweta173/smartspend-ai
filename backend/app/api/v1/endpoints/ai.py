from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.services import ai_service
from app.models.user import User
from app.models.chat_message import ChatMessage
import datetime

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str


class InsightRequest(BaseModel):
    month: str | None = None


@router.post("/chat")
def chat(data: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ai_service.chat(db, current_user.id, data.message)


@router.post("/insights")
def insights(data: InsightRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    month = data.month or datetime.date.today().strftime("%Y-%m")
    return {"insights": ai_service.generate_insights(db, current_user.id, month), "month": month}


@router.get("/history")
def history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
        .all()
    )
    return [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs]


@router.delete("/history", status_code=204)
def clear_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
