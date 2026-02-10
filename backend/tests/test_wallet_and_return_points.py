async def test_return_points_list(client):
    """Return-points endpoint is public (no auth needed)."""
    resp = await client.get("/return-points")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and isinstance(data["items"], list)
    assert "total" in data and isinstance(data["total"], int)


async def test_wallet_requires_auth(client):
    """Wallet balance endpoint rejects requests without a token."""
    resp = await client.get("/wallet/balance")
    assert resp.status_code == 403


async def test_wallet_balance_with_auth(client, auth_headers):
    """Wallet balance endpoint succeeds with a valid auth token."""
    resp = await client.get("/wallet/balance", headers=auth_headers)
    assert resp.status_code == 200
    balance = resp.json()
    assert "balanceCents" in balance
    assert "lastUpdated" in balance
