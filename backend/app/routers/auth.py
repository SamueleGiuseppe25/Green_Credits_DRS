from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/register", status_code=201)
async def register():
    # Placeholder implementation matching OpenAPI shape
    return {
        "accessToken": "dev",
        "refreshToken": "dev",
        "tokenType": "Bearer",
        "expiresIn": 3600,
    }


@router.post("/login")
async def login():
    # Placeholder implementation matching OpenAPI shape
    return {
        "accessToken": "dev",
        "refreshToken": "dev",
        "tokenType": "Bearer",
        "expiresIn": 3600,
    }


