import logging
from typing import Any, Callable, Coroutine

logger = logging.getLogger("gc.events")

_handlers: dict[str, list[Callable[..., Coroutine[Any, Any, None]]]] = {}


def register_handler(event_name: str, handler: Callable[..., Coroutine[Any, Any, None]]) -> None:
    _handlers.setdefault(event_name, []).append(handler)
    logger.info("Registered handler %s for event %s", handler.__name__, event_name)


async def publish_event(event_name: str, payload: dict[str, Any]) -> None:
    for handler in _handlers.get(event_name, []):
        try:
            await handler(payload)
        except Exception:
            logger.exception("Handler %s failed for event %s", handler.__name__, event_name)


def clear_handlers(event_name: str | None = None) -> None:
    if event_name is None:
        _handlers.clear()
    else:
        _handlers.pop(event_name, None)
