"""Tests for auth endpoints: register, login, /auth/me."""


async def test_register_success(client):
    """Register returns 201 with user data."""
    resp = await client.post(
        "/auth/register",
        json={
            "email": "new@example.com",
            "password": "secure123",
            "full_name": "New User",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data


async def test_register_duplicate_email(client):
    """Register with an existing email returns 400."""
    payload = {
        "email": "dup@example.com",
        "password": "secure123",
        "full_name": "First",
    }
    resp1 = await client.post("/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/auth/register", json=payload)
    assert resp2.status_code == 400


async def test_login_success(client):
    """Login with valid credentials returns 200 and access_token."""
    await client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "pass123456"},
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "pass123456"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client):
    """Login with wrong password returns 401."""
    await client.post(
        "/auth/register",
        json={"email": "wrongpw@example.com", "password": "correct123"},
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "wrongpw@example.com", "password": "incorrect"},
    )
    assert resp.status_code == 401


async def test_me_authenticated(client, auth_headers):
    """/auth/me returns user data with a valid token."""
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data


async def test_me_unauthenticated(client):
    """/auth/me without a token returns 403."""
    resp = await client.get("/auth/me")
    assert resp.status_code == 403


async def test_me_admin_flag(client, admin_headers):
    """/auth/me reflects is_admin=true for admin users."""
    resp = await client.get("/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_admin"] is True
