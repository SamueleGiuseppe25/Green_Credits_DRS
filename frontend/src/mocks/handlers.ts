import { http, HttpResponse } from 'msw'

const API = import.meta.env.VITE_API_BASE_URL || ''

export const handlers = [
  // Auth
  http.post(`${API}/auth/register`, async () => {
    return HttpResponse.json(
      {
        accessToken: 'mock_access',
        refreshToken: 'mock_refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
      { status: 201 }
    )
  }),
  http.post(`${API}/auth/login`, async () => {
    return HttpResponse.json({
      accessToken: 'mock_access',
      refreshToken: 'mock_refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
  }),
  http.get(`${API}/auth/me`, async ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 })
    }
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      is_admin: false,
      is_driver: false,
    })
  }),

  // Wallet
  http.get(`${API}/wallet/balance`, async () => {
    return HttpResponse.json({ balanceCents: 1230, lastUpdated: new Date().toISOString() })
  }),
  http.get(`${API}/wallet/history`, async ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 20)
    const total = 42
    const items = Array.from({ length: pageSize }).map((_, i) => ({
      id: `txn_${(page - 1) * pageSize + i + 1}`,
      ts: new Date(Date.now() - i * 3600_000).toISOString(),
      kind: 'return',
      amountCents: 15,
      note: '1 can @ €0.15',
    }))
    return HttpResponse.json({ items, total, page, pageSize })
  }),

  // Simulator
  http.post(`${API}/simulate/return`, async () => {
    return HttpResponse.json({ receiptId: 'rcp_01H', creditedCents: 75, newBalanceCents: 1305 })
  }),

  // Claims
  http.post(`${API}/claims/submit`, async () => {
    return HttpResponse.json(
      {
        claimId: 'clm_01H',
        status: 'Pending',
        parsed: {
          receiptId: '366073070',
          retailer: 'SuperValu Dundrum',
          amountCents: 105,
          ts: new Date().toISOString(),
        },
      },
      { status: 202 }
    )
  }),

  // Return points
  http.get(`${API}/return-points`, async () => {
    return HttpResponse.json({
      items: [
        {
          id: 'rp_001',
          name: 'SuperMart Dundrum RVM',
          type: 'RVM',
          eircode: 'D14 XXXX',
          retailer: 'SuperMart',
          lat: 53.2891,
          lng: -6.2387,
          hours: { mon_fri: '08:00-22:00', sat: '08:00-22:00', sun: '09:00-21:00' },
          services: ['voucher', 'donation'],
          lastVerifiedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    })
  }),

  // Health
  http.get(`${API}/healthz`, async () => {
    return HttpResponse.json({ status: 'ok', db: 'ok', version: '0.1.0' })
  }),

  // Admin pending claims (mocked list)
  http.get(`${API}/admin/pending-claims`, async () => {
    return HttpResponse.json([
      { claimId: 'clm_01H', status: 'Pending', retailer: 'SuperValu', amountCents: 105, ts: new Date().toISOString() },
    ])
  }),
]


