import asyncio
import os

import pytest
from httpx import AsyncClient
from fastapi import FastAPI

from app.main import create_app


@pytest.mark.asyncio
async def test_healthz_not_configured(monkeypatch):
    # no DATABASE_URL and no sqlite fallback → not_configured
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("USE_SQLITE_DEV", "false")
    app: FastAPI = create_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data.get("status") == "ok"
        assert data.get("db") == "not_configured"


@pytest.mark.asyncio
async def test_healthz_ok_with_sqlite_dev(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("USE_SQLITE_DEV", "true")
    app: FastAPI = create_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data.get("status") == "ok"
        assert data.get("db") == "ok"


