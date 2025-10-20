import pytest
from httpx import AsyncClient
from fastapi import FastAPI

from app.main import create_app


@pytest.mark.asyncio
async def test_return_points_list(monkeypatch):
    monkeypatch.setenv("USE_SQLITE_DEV", "true")
    app: FastAPI = create_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get("/return-points")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data and isinstance(data["items"], list)
        assert "total" in data and isinstance(data["total"], int)


@pytest.mark.asyncio
async def test_wallet_balance_and_history(monkeypatch):
    monkeypatch.setenv("USE_SQLITE_DEV", "true")
    app: FastAPI = create_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        r1 = await client.get("/wallet/balance")
        assert r1.status_code == 200
        balance = r1.json()
        assert "balanceCents" in balance
        assert "lastUpdated" in balance

        r2 = await client.get("/wallet/history")
        assert r2.status_code == 200
        hist = r2.json()
        assert set(["items", "total", "page", "pageSize"]) <= set(hist.keys())



