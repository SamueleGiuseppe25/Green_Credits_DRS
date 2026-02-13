import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..config import get_settings
from ..dependencies.auth import CurrentUserDep

logger = logging.getLogger("gc.payments")

router = APIRouter(prefix="/payments", tags=["Payments"])


class CheckoutSessionRequest(BaseModel):
    planCode: str


@router.post("/checkout-session")
async def create_checkout_session(current_user: CurrentUserDep, payload: CheckoutSessionRequest):
    plan = (payload.planCode or "").strip().lower()
    if plan not in {"weekly", "monthly", "yearly"}:
        raise HTTPException(status_code=400, detail="Invalid plan code")

    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured (missing STRIPE_SECRET_KEY)")

    price_by_plan = {
        "weekly": settings.stripe_price_id_weekly,
        "monthly": settings.stripe_price_id_monthly,
        "yearly": settings.stripe_price_id_yearly,
    }
    price_id = price_by_plan.get(plan)
    if not price_id:
        raise HTTPException(status_code=500, detail=f"Stripe price id not configured for plan: {plan}")

    stripe.api_key = settings.stripe_secret_key

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{settings.frontend_url}/subscribe/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/subscribe/cancel",
            client_reference_id=str(current_user.id),
        )
    except Exception as e:  # pragma: no cover (best-effort)
        logger.exception("Failed to create checkout session")
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": session.url}

