# Purpose: quick helper to generate a bcrypt hash for a password (dev use only)
from fastapi import APIRouter
from app.core.security import get_password_hash


router = APIRouter(prefix="/dev", tags=["dev"], include_in_schema=False)


@router.get("/hash/{plain}")
def hash_password(plain: str):
    return {"hash": get_password_hash(plain)}


