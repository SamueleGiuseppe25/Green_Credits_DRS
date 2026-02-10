"""Tests for driver-related endpoints."""


async def test_admin_creates_driver(client, admin_headers):
    """Admin can create a driver and receives profile data."""
    resp = await client.post(
        "/admin/drivers",
        json={
            "email": "newdriver@example.com",
            "password": "driver123456",
            "fullName": "New Driver",
            "vehicleType": "bike",
            "vehiclePlate": "B-001",
            "phone": "+353850000000",
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["vehicleType"] == "bike"
    assert data["vehiclePlate"] == "B-001"


async def test_regular_user_cannot_create_driver(client, auth_headers):
    """Non-admin user cannot create a driver (403)."""
    resp = await client.post(
        "/admin/drivers",
        json={
            "email": "blocked@example.com",
            "password": "driver123456",
            "fullName": "Blocked Driver",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 403


async def test_driver_sees_own_profile(client, driver_headers):
    """Driver can access their own profile."""
    resp = await client.get("/drivers/me/profile", headers=driver_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "vehicleType" in data
    assert data["isAvailable"] is True


async def test_admin_lists_all_drivers(client, admin_headers):
    """Admin can list all drivers."""
    # Create a driver first so the list is non-empty
    await client.post(
        "/admin/drivers",
        json={
            "email": "listed@example.com",
            "password": "driver123456",
            "fullName": "Listed Driver",
        },
        headers=admin_headers,
    )
    resp = await client.get("/admin/drivers", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
