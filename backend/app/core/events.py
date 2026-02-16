"""
Lightweight in-process event bus for notifications.

This is the single entry point for publishing events. To swap for RabbitMQ later:
- Replace the implementation of publish_event() to enqueue a message to a RabbitMQ
  exchange/queue instead of invoking handlers in-process.
- Keep register_handler() for local/debug handlers if needed, or remove and have
  a separate consumer process subscribe to the queue and dispatch to email/slack etc.
"""
import asyncio
import logging
from collections import defaultdict
from typing import Any, Callable

logger = logging.getLogger("gc.events")

_handlers: dict[str, list[Callable[[dict], Any]]] = defaultdict(list)


def register_handler(event_name: str, handler: Callable[[dict], Any]) -> None:
    """Register a handler for the given event. Handlers can be sync or async."""
    _handlers[event_name].append(handler)


def clear_handlers(event_name: str) -> None:
    """Remove all handlers for an event (e.g. so reload does not duplicate)."""
    _handlers[event_name] = []


async def _run_one(handler: Callable[[dict], Any], payload: dict) -> None:
    """Run a single handler; await if it returns a coroutine. Never let exceptions escape."""
    try:
        result = handler(payload)
        if asyncio.iscoroutine(result):
            await result
    except Exception as e:
        logger.exception("Event handler failed for payload %s: %s", payload, e)


def publish_event(event_name: str, payload: dict) -> None:
    """
    Publish an event to all registered handlers. Non-blocking: schedules async
    handler execution via asyncio.create_task so the caller is not blocked.

    To replace with RabbitMQ later: publish a message to your broker here instead
    of iterating _handlers; a separate worker would consume and run handlers.
    """
    handlers = _handlers.get(event_name)
    if not handlers:
        return
    for h in handlers:
        try:
            asyncio.create_task(_run_one(h, payload))
        except RuntimeError:
            # No running event loop (e.g. sync context) — run in a new loop or skip
            logger.warning("No event loop for publish_event(%s), skipping handlers", event_name)
