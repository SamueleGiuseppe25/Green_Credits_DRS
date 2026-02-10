"""Tests for admin-only endpoints."""


async def test_admin_ping(client, admin_headers):
    """Admin ping endpoint returns 200 for admin users."""
    resp = await client.get("/admin/ping", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


async def test_admin_ping_forbidden_for_regular_user(client, auth_headers):
    """Admin ping endpoint returns 403 for regular users."""
    resp = await client.get("/admin/ping", headers=auth_headers)
    assert resp.status_code == 403


async def test_admin_metrics(client, admin_headers):
    """Admin metrics endpoint returns expected keys."""
    resp = await client.get("/admin/metrics", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    expected_keys = {
        "users_total",
        "active_subscriptions",
        "collections_total",
        "collections_scheduled",
        "voucher_total_cents",
    }
    assert expected_keys <= set(data.keys())


async def test_admin_list_collections(client, admin_headers):
    """Admin collections endpoint returns 200 with a list."""
    resp = await client.get("/admin/collections", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_admin_collections_forbidden_for_non_admin(client, auth_headers):
    """Admin collections endpoint returns 403 for non-admin users."""
    resp = await client.get("/admin/collections", headers=auth_headers)
    assert resp.status_code == 403
