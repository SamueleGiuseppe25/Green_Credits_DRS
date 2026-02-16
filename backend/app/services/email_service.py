"""
Dev-safe email sending. Logs/prints only; no SMTP.

TODO: Integrate a real provider (SendGrid, Mailtrap, SMTP) for production.
"""
import logging

logger = logging.getLogger("gc.email")


async def send_email(to: str, subject: str, body: str) -> None:
    """
    Send an email. In dev, only logs the content.
    TODO: Add SendGrid/Mailtrap/SMTP integration for production.
    """
    logger.info(
        "EMAIL (dev) to=%r subject=%r body_len=%d\n---\n%s\n---",
        to, subject, len(body), body,
    )
    # Optional: print so it appears in console when running uvicorn
    print(f"[EMAIL] To: {to}\nSubject: {subject}\n{body}\n")
