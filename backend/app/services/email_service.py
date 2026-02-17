import logging

import resend

from ..config import get_settings

logger = logging.getLogger("gc.email")


async def send_email(to: str, subject: str, html_body: str) -> None:
    settings = get_settings()

    if settings.environment != "production":
        logger.info("DEV email to=%s subject=%s body=%s", to, subject, html_body[:200])
        return

    if not settings.resend_api_key or not settings.resend_from_email:
        logger.warning("Resend not configured — skipping email to %s", to)
        return

    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send({
            "from": settings.resend_from_email,
            "to": [to],
            "subject": subject,
            "html": html_body,
        })
        logger.info("Email sent to %s subject=%s", to, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to)
