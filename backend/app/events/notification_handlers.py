import logging
from typing import Any

from ..core.events import register_handler
from ..services.email_service import send_email

logger = logging.getLogger("gc.notifications")


async def _on_subscription_confirmed(payload: dict[str, Any]) -> None:
    try:
        await send_email(
            to=payload["email"],
            subject="Your GreenCredits subscription is active",
            html_body=(
                f"<p>Hi! Your <strong>{payload['plan_code']}</strong> plan is now active.</p>"
                f"<p>Amount charged: &euro;{payload['amount_eur']:.2f}</p>"
                f"<p>Invoice: {payload.get('stripe_invoice_id', 'N/A')}</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling subscription.confirmed")


async def _on_collection_scheduled(payload: dict[str, Any]) -> None:
    try:
        await send_email(
            to=payload["email"],
            subject=f"Collection #{payload['collection_id']} scheduled",
            html_body=(
                f"<p>Your collection <strong>#{payload['collection_id']}</strong> is scheduled for "
                f"<strong>{payload['scheduled_at']}</strong>.</p>"
                f"<p>Return point: {payload.get('return_point_name', 'N/A')}</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling collection.scheduled")


async def _on_collection_collected(payload: dict[str, Any]) -> None:
    try:
        await send_email(
            to=payload["email"],
            subject=f"Collection #{payload['collection_id']} picked up",
            html_body=(
                f"<p>Your bottles for collection <strong>#{payload['collection_id']}</strong> "
                f"have been picked up by driver <strong>{payload.get('driver_name', 'your driver')}</strong>.</p>"
                f"<p>We'll notify you once the bottles are redeemed.</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling collection.collected")


async def _on_collection_completed(payload: dict[str, Any]) -> None:
    try:
        voucher = payload.get("voucher_amount_eur", 0)
        await send_email(
            to=payload["email"],
            subject=f"Collection #{payload['collection_id']} completed",
            html_body=(
                f"<p>Your collection <strong>#{payload['collection_id']}</strong> has been completed!</p>"
                f"<p>Voucher value: &euro;{voucher:.2f}</p>"
                f"<p>Proof: {payload.get('proof_url', 'N/A')}</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling collection.completed")


async def _on_wallet_credit(payload: dict[str, Any]) -> None:
    try:
        await send_email(
            to=payload["email"],
            subject="Wallet credited",
            html_body=(
                f"<p>&euro;{payload['amount_eur']:.2f} has been added to your GreenCredits wallet.</p>"
                f"<p>New balance: &euro;{payload['new_balance_eur']:.2f}</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling wallet.credit.created")


async def _on_claim_resolved(payload: dict[str, Any]) -> None:
    try:
        response_text = payload.get("admin_response") or "No additional details provided."
        await send_email(
            to=payload["email"],
            subject=f"Your claim #{payload['claim_id']} has been resolved",
            html_body=(
                f"<p>Your support claim <strong>#{payload['claim_id']}</strong> "
                f"has been marked as resolved.</p>"
                f"<p><strong>Admin response:</strong> {response_text}</p>"
                f"<p>Thank you for using GreenCredits.</p>"
            ),
        )
    except Exception:
        logger.exception("Failed handling claim.resolved")


def register_notification_handlers() -> None:
    register_handler("subscription.confirmed", _on_subscription_confirmed)
    register_handler("collection.scheduled", _on_collection_scheduled)
    register_handler("collection.collected", _on_collection_collected)
    register_handler("collection.completed", _on_collection_completed)
    register_handler("wallet.credit.created", _on_wallet_credit)
    register_handler("claim.resolved", _on_claim_resolved)
    logger.info("All notification handlers registered")
