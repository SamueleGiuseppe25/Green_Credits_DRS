"""
Notification handlers: subscribe to events and send emails via email_service.

All handlers catch exceptions and log; they must never raise.
"""
import logging

from ..core.events import register_handler
from ..services.email_service import send_email

logger = logging.getLogger("gc.notifications")


def _safe_float(v, default: float = 0.0) -> float:
    try:
        return float(v) if v is not None else default
    except (TypeError, ValueError):
        return default


async def _on_subscription_confirmed(payload: dict) -> None:
    try:
        email = payload.get("email") or ""
        plan_code = payload.get("plan_code") or "—"
        amount_eur = _safe_float(payload.get("amount_eur"))
        invoice_id = payload.get("stripe_invoice_id") or "—"
        ts = payload.get("ts") or ""
        subject = "Subscription Confirmed"
        body = (
            f"Your GreenCredits subscription is confirmed.\n\n"
            f"Plan: {plan_code}\n"
            f"Amount: €{amount_eur:.2f}\n"
            f"Invoice ID: {invoice_id}\n"
            f"Time: {ts}\n"
        )
        await send_email(to=email, subject=subject, body=body)
    except Exception as e:
        logger.exception("subscription.confirmed handler failed: %s", e)


async def _on_wallet_credit_created(payload: dict) -> None:
    try:
        email = payload.get("email") or ""
        amount_eur = _safe_float(payload.get("amount_eur"))
        proof_ref = payload.get("proof_ref") or "—"
        new_balance_eur = payload.get("new_balance_eur")
        nb = f"€{_safe_float(new_balance_eur):.2f}" if new_balance_eur is not None else "—"
        ts = payload.get("ts") or ""
        subject = "Voucher Added"
        body = (
            f"Voucher balance credit has been added.\n\n"
            f"Amount: €{amount_eur:.2f}\n"
            f"Reference: {proof_ref}\n"
            f"New balance: {nb}\n"
            f"Time: {ts}\n"
        )
        await send_email(to=email, subject=subject, body=body)
    except Exception as e:
        logger.exception("wallet.credit.created handler failed: %s", e)


async def _on_wallet_debit_donated(payload: dict) -> None:
    try:
        email = payload.get("email") or ""
        amount_eur = _safe_float(payload.get("amount_eur"))
        proof_ref = payload.get("proof_ref") or "—"
        new_balance_eur = payload.get("new_balance_eur")
        nb = f"€{_safe_float(new_balance_eur):.2f}" if new_balance_eur is not None else "—"
        ts = payload.get("ts") or ""
        subject = "Donation Confirmed"
        body = (
            f"Your donation has been confirmed.\n\n"
            f"Amount: €{amount_eur:.2f}\n"
            f"Proof reference: {proof_ref}\n"
            f"New balance: {nb}\n"
            f"Time: {ts}\n"
        )
        await send_email(to=email, subject=subject, body=body)
    except Exception as e:
        logger.exception("wallet.debit.donated handler failed: %s", e)


async def _on_wallet_debit_redeemed(payload: dict) -> None:
    try:
        email = payload.get("email") or ""
        amount_eur = _safe_float(payload.get("amount_eur"))
        proof_ref = payload.get("proof_ref") or "—"
        new_balance_eur = payload.get("new_balance_eur")
        nb = f"€{_safe_float(new_balance_eur):.2f}" if new_balance_eur is not None else "—"
        ts = payload.get("ts") or ""
        subject = "Redemption Confirmed"
        body = (
            f"Your redemption has been confirmed.\n\n"
            f"Amount: €{amount_eur:.2f}\n"
            f"Proof reference: {proof_ref}\n"
            f"New balance: {nb}\n"
            f"Time: {ts}\n"
        )
        await send_email(to=email, subject=subject, body=body)
    except Exception as e:
        logger.exception("wallet.debit.redeemed handler failed: %s", e)


def register_notification_handlers() -> None:
    """Register all notification handlers with the event bus. Call once at app startup.
    Idempotent for reload: clears these events first so handlers are not duplicated."""
    from ..core.events import clear_handlers
    for name in ("subscription.confirmed", "wallet.credit.created", "wallet.debit.donated", "wallet.debit.redeemed"):
        clear_handlers(name)
    register_handler("subscription.confirmed", lambda p: _on_subscription_confirmed(p))
    register_handler("wallet.credit.created", lambda p: _on_wallet_credit_created(p))
    register_handler("wallet.debit.donated", lambda p: _on_wallet_debit_donated(p))
    register_handler("wallet.debit.redeemed", lambda p: _on_wallet_debit_redeemed(p))
