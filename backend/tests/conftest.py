"""Shared test fixtures for backend tests.

Uses SQLite so tests run instantly without Docker.

Strategy: Create a test-specific engine + session factory, then use FastAPI's
dependency_overrides to swap get_db_session. This avoids fragile module reloads.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.services.db import Base, get_db_session
from app.config import get_settings


@pytest.fixture()
async def app(tmp_path):
    """Create a fresh FastAPI app backed by an isolated SQLite database."""
    db_path = tmp_path / "test.db"
    db_url = f"sqlite+aiosqlite:///{db_path}"

    test_engine = create_async_engine(db_url, echo=False)
    TestSessionLocal = async_sessionmaker(
        test_engine, expire_on_commit=False, class_=AsyncSession
    )

    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    get_settings.cache_clear()

    from app.main import create_app

    application = create_app()

    # Override the DB session dependency so all routes use our test database
    async def _test_db_session():
        async with TestSessionLocal() as session:
            yield session

    application.dependency_overrides[get_db_session] = _test_db_session

    # Expose test engine/session on the app so tests like healthz can access them
    application.state.test_engine = test_engine
    application.state.test_session_local = TestSessionLocal

    yield application

    # Cleanup
    application.dependency_overrides.clear()
    await test_engine.dispose()
    get_settings.cache_clear()


@pytest.fixture()
async def client(app):
    """Async HTTP client that talks directly to the ASGI app (no server needed)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture()
async def auth_token(client: AsyncClient) -> str:
    """Register a fresh user and return an access token."""
    resp = await client.post(
        "/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "test123456",
            "full_name": "Test User",
        },
    )
    assert resp.status_code == 201, resp.text

    resp = await client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": "test123456"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def auth_headers(auth_token: str) -> dict:
    """Convenience dict with Authorization header."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture()
async def admin_token(client: AsyncClient, app) -> str:
    """Register a user, promote to admin via DB, and return an access token."""
    from app.models.user import User

    resp = await client.post(
        "/auth/register",
        json={
            "email": "admin@example.com",
            "password": "admin123456",
            "full_name": "Admin User",
        },
    )
    assert resp.status_code == 201, resp.text

    # Promote to admin directly using the overridden DB session
    override_fn = app.dependency_overrides[get_db_session]
    gen = override_fn()
    session = await gen.__anext__()
    try:
        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        user = result.scalar_one()
        user.is_admin = True
        await session.commit()
    finally:
        try:
            await gen.__anext__()
        except StopAsyncIteration:
            pass

    resp = await client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin123456"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token: str) -> dict:
    """Convenience dict with admin Authorization header."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
async def driver_token(client: AsyncClient, admin_headers: dict) -> str:
    """Create a driver via admin endpoint, login, and return a driver access token."""
    resp = await client.post(
        "/admin/drivers",
        json={
            "email": "driver@example.com",
            "password": "driver123456",
            "fullName": "Driver One",
            "vehicleType": "van",
            "vehiclePlate": "D-123-ABC",
            "phone": "+353851234567",
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201, resp.text

    resp = await client.post(
        "/auth/login",
        json={"email": "driver@example.com", "password": "driver123456"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def driver_headers(driver_token: str) -> dict:
    """Convenience dict with driver Authorization header."""
    return {"Authorization": f"Bearer {driver_token}"}
