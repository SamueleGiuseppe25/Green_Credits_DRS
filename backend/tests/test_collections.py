"""Tests for collection endpoints."""


async def test_list_my_collections_with_auth(client, auth_headers):
    """Authenticated user can list their own collections."""
    resp = await client.get("/collections/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert "total" in data


async def test_collections_require_auth(client):
    """Collections endpoints reject unauthenticated requests."""
    resp = await client.get("/collections/me")
    assert resp.status_code == 403


async def test_create_collection_requires_active_subscription(client, auth_headers):
    """Creating a collection without an active subscription returns 403."""
    resp = await client.post(
        "/collections",
        json={
            "scheduledAt": "2026-03-01T10:00:00",
            "returnPointId": 1,
            "bagCount": 2,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 403
