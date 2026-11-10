from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.services.category_service import seed_default_categories
from app.services.account_service import seed_default_accounts
from app.core.config import settings
from jose import JWTError
import redis as _redis

_redis_client: _redis.Redis | None = None

def _get_redis() -> _redis.Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = _redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
            _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


def _check_login_rate(identifier: str) -> None:
    """Block after 10 failed-or-succeeded login attempts per 15 minutes per email."""
    r = _get_redis()
    if r is None:
        return  # Redis unavailable — skip rate limiting rather than breaking login
    key = f"login_rate:{identifier}"
    try:
        count = r.incr(key)
        if count == 1:
            r.expire(key, 900)  # 15-minute window
        if count > 10:
            ttl = r.ttl(key)
            mins = max(1, (ttl or 900) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Try again in {mins} minute(s).",
                headers={"Retry-After": str(ttl or 900)},
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Never break login due to Redis errors


def register_user(db: Session, data: RegisterRequest) -> dict:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    seed_default_categories(db, user.id)
    seed_default_accounts(db, user.id)
    return _make_tokens(user)


def login_user(db: Session, data: LoginRequest) -> dict:
    _check_login_rate(data.email.lower())
    user = db.query(User).filter(User.email == data.email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return _make_tokens(user)


def refresh_tokens(db: Session, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _make_tokens(user)


def _make_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
