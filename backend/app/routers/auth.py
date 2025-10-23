from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthTokenResponse(BaseModel):
    accessToken: str
    tokenType: str
    expiresIn: int
    user: dict

router = APIRouter()


@router.post("/register", status_code=201, response_model=AuthTokenResponse)
async def register():
    # Placeholder implementation matching OpenAPI shape
    return {
        "accessToken": "user",
        "tokenType": "Bearer",
        "expiresIn": 3600,
        "user": {"id": 1, "email": "demo@example.com", "role": "user"},
    }


@router.post("/login", response_model=AuthTokenResponse)
async def login(body: AuthLoginRequest):
    # Placeholder implementation matching OpenAPI shape
    role = "admin" if body.email.endswith("@admin") else "user"
    token_value = "admin" if role == "admin" else "user"
    return {
        "accessToken": token_value,
        "tokenType": "Bearer",
        "expiresIn": 3600,
        "user": {"id": 1, "email": body.email, "role": role},
    }


