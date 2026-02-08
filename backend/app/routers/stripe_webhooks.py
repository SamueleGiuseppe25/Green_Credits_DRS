import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..services.db import get_db_session
from ..services.subscriptions import get_me as svc_get_me, choose_plan as svc_choose

logger = logging.getLogger("gc.webhooks.stripe")

router = APIRouter(tags=["Webhooks"])


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    settings = get_settings()
    if not settings.stripe_webhook_secret or not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe webhook is not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except Exception:
        logger.warning("Stripe webhook signature verification failed")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event.get("type")
    if event_type != "checkout.session.completed":
        return {"ok": True}

    session_obj = (event.get("data") or {}).get("object") or {}
    checkout_session_id = session_obj.get("id")
    ref = session_obj.get("client_reference_id")
    if not ref:
        logger.warning("Stripe webhook missing client_reference_id")
        return {"ok": True}

    try:
        user_id = int(ref)
    except Exception:
        logger.warning("Stripe webhook invalid client_reference_id: %s", ref)
        return {"ok": True}

    # Resolve purchased price_id -> planCode
    try:
        line_items = stripe.checkout.Session.list_line_items(checkout_session_id, limit=1)
        price_id = line_items.data[0].price.id if line_items.data else None
    except Exception:
        logger.exception("Failed to list checkout session line items: %s", checkout_session_id)
        return {"ok": True}

    price_map = {
        settings.stripe_price_weekly: "weekly",
        settings.stripe_price_monthly: "monthly",
        settings.stripe_price_yearly: "yearly",
    }
    plan_code = price_map.get(price_id)
    if not plan_code:
        logger.warning("Unknown price_id from Stripe: %s", price_id)
        return {"ok": True}

    # Idempotency: if already active with same plan, do nothing
    current = await svc_get_me(session, user_id)
    if current and current.status == "active" and current.plan_code == plan_code:
        logger.info("Stripe webhook idempotent: user_id=%s plan=%s", user_id, plan_code)
        return {"ok": True}

    try:
        await svc_choose(session, user_id, plan_code)
        logger.info("Stripe webhook activated subscription: user_id=%s plan=%s", user_id, plan_code)
    except Exception:
        logger.exception("Failed to activate subscription for user_id=%s plan=%s", user_id, plan_code)
        return {"ok": True}

    return {"ok": True}

