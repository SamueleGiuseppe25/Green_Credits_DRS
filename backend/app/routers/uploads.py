from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..dependencies.auth import get_current_user

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


@router.post("/proof")
async def upload_proof_image(
    image: UploadFile = File(...),
    _user=Depends(get_current_user),  # any authenticated user
):
    if image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images are allowed")

    data = await image.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    # Preserve extension when possible, fallback to MIME-derived extension.
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png"}:
        suffix = ".jpg" if image.content_type == "image/jpeg" else ".png"

    filename = f"{uuid4().hex}{suffix}"
    uploads_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    (uploads_dir / filename).write_bytes(data)

    return {"url": f"/uploads/{filename}"}

