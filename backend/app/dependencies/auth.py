
from typing import Annotated, Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr


bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: int
    email: EmailStr
    role: Literal["user", "admin"] = "user"


def decode_token_to_user(creds: HTTPAuthorizationCredentials | None) -> CurrentUser:
    # MVP: interpret token literally; "admin" => admin, anything else => user
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth")
    token = (creds.credentials or "").strip().lower()
    role = "admin" if token == "admin" else "user"
    # Stub identity; adapt once real auth is ready
    return CurrentUser(id=1, email="user@example.com", role=role)


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> CurrentUser:
    return decode_token_to_user(creds)


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user



