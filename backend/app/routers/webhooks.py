"""
Stripe webhook endpoint (test-mode friendly).

How to test with Stripe CLI:
  stripe listen --forward-to localhost:8000/webhooks/stripe
  stripe trigger checkout.session.completed
  stripe trigger invoice.paid

Required env vars:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Request

from ..core.events import publish_event

logger = logging.getLogger("gc.webhooks")

router = APIRouter()


def _get_env(name: str) -> Optional[str]:
    v = os.getenv(name)
    return v.strip() if isinstance(v, str) and v.strip() else None


def _as_dict(obj: Any) -> dict:
    # Stripe objects behave like dicts; keep this defensive.
    try:
        return dict(obj)
    except Exception:
        return {}


@router.post("/stripe")
async def stripe_webhook(request: Request) -> dict:
    """
    Handle Stripe webhooks. Always returns 200 quickly (logs on errors).

    NOTE: We verify Stripe signatures when possible. If verification fails, we log and
    return 200 without processing the event (dev-safe; avoids crashes/retries).
    """
    try:
        # Lazy import so dev servers without stripe installed still start.
        import stripe  # type: ignore
    except Exception as e:  # pragma: no cover
        logger.exception("stripe package not available: %s", e)
        return {"received": False}

    secret_key = _get_env("STRIPE_SECRET_KEY")
    webhook_secret = _get_env("STRIPE_WEBHOOK_SECRET")
    if not secret_key or not webhook_secret:
        logger.warning("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET; ignoring webhook")
        return {"received": False}

    stripe.api_key = secret_key

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # Verify signature
    try:
        event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=webhook_secret)
    except Exception as e:
        logger.warning("Stripe webhook signature verification failed: %s", e)
        return {"received": False}

    # Handle event types (never raise)
    try:
        event_type = getattr(event, "type", None) or _as_dict(event).get("type")
        data_obj = getattr(getattr(event, "data", None), "object", None)
        obj = data_obj if data_obj is not None else _as_dict(_as_dict(event).get("data", {})).get("object")

        if event_type == "checkout.session.completed":
            session = obj
            s = _as_dict(session)
            session_id = s.get("id")
            customer_id = s.get("customer")
            customer_details = _as_dict(s.get("customer_details") or {})
            email = customer_details.get("email") or s.get("customer_email")
            amount_total = s.get("amount_total") or 0
            currency = (s.get("currency") or "").lower()
            subscription_id = s.get("subscription")

            # Ensure customer sync (retrieve & check email)
            if customer_id:
                try:
                    cust = stripe.Customer.retrieve(customer_id)
                    cust_d = _as_dict(cust)
                    cust_email = cust_d.get("email")
                    if not cust_email:
                        logger.warning("Stripe customer %s has no email", customer_id)
                except Exception as e:
                    logger.warning("Could not retrieve Stripe customer %s: %s", customer_id, e)
            else:
                logger.warning("checkout.session.completed has no customer (session=%s)", session_id)

            if currency and currency != "eur":
                logger.info("Stripe currency is %s; treating amount as EUR for payload compatibility", currency)

            publish_event(
                "subscription.confirmed",
                {
                    "email": email or "",
                    "plan_code": "stripe_subscription",
                    "amount_eur": (amount_total or 0) / 100.0,
                    "stripe_invoice_id": session_id,
                    "ts": datetime.utcnow().isoformat(),
                    "stripe_customer_id": customer_id,
                    "stripe_subscription_id": subscription_id,
                },
            )

        elif event_type == "invoice.paid":
            invoice = obj
            inv = _as_dict(invoice)
            invoice_id = inv.get("id")
            customer_id = inv.get("customer")
            email = inv.get("customer_email")
            amount_paid = inv.get("amount_paid") or inv.get("amount_due") or 0
            currency = (inv.get("currency") or "").lower()

            if not email and customer_id:
                try:
                    cust = stripe.Customer.retrieve(customer_id)
                    email = _as_dict(cust).get("email")
                except Exception as e:
                    logger.warning("Could not retrieve Stripe customer %s for invoice email: %s", customer_id, e)

            if currency and currency != "eur":
                logger.info("Stripe currency is %s; treating amount as EUR for payload compatibility", currency)

            publish_event(
                "subscription.confirmed",
                {
                    "email": email or "",
                    "plan_code": "stripe_subscription",
                    "amount_eur": (amount_paid or 0) / 100.0,
                    "stripe_invoice_id": invoice_id,
                    "ts": datetime.utcnow().isoformat(),
                    "stripe_customer_id": customer_id,
                },
            )

        else:
            # Ignore other Stripe events for now (safe/no-op).
            pass

    except Exception as e:
        logger.exception("Stripe webhook processing failed: %s", e)
        return {"received": False}

    return {"received": True}

