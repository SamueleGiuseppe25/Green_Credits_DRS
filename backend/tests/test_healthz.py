from httpx import ASGITransport, AsyncClient

from app.config import get_settings
from app.main import create_app


async def test_healthz_not_configured(monkeypatch):
    """Health endpoint reports 'not_configured' when no DB is set."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("USE_SQLITE_DEV", "false")
    get_settings.cache_clear()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data.get("status") == "ok"
        assert data.get("db") == "not_configured"
    get_settings.cache_clear()


async def test_healthz_ok_with_sqlite_dev(client, monkeypatch):
    """Health endpoint reports 'ok' when backed by a working test database."""
    import app.routers.healthz as healthz_mod

    # Ensure healthz sees DB as configured (otherwise it returns not_configured before
    # checking engine/SessionLocal); CI has no DATABASE_URL or USE_SQLITE_DEV.
    monkeypatch.setenv("USE_SQLITE_DEV", "true")
    get_settings.cache_clear()

    # Retrieve the test engine/session from the app fixture
    app_instance = client._transport.app  # type: ignore[attr-defined]
    test_engine = app_instance.state.test_engine
    test_session_local = app_instance.state.test_session_local

    # Temporarily patch healthz module-level references (healthz imports from services.db)
    original_engine = healthz_mod.engine
    original_session = healthz_mod.SessionLocal
    healthz_mod.engine = test_engine
    healthz_mod.SessionLocal = test_session_local

    try:
        resp = await client.get("/healthz")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data.get("status") == "ok"
        assert data.get("db") == "ok"
    finally:
        healthz_mod.engine = original_engine
        healthz_mod.SessionLocal = original_session
        get_settings.cache_clear()
