import { API_BASE_URL } from './api'
import { getToken } from './auth'

export type AdminMetrics = {
  users_total: number
  active_subscriptions: number
  collections_total: number
  collections_scheduled: number
  voucher_total_cents: number
}

export type AdminCollection = {
  id: number
  user_id: number
  return_point_id: number
  scheduled_at: string // ISO datetime
  status: string
  bag_count: number
  notes: string | null
  driver_id: number | null
  proof_url: string | null
}

export type AdminDriver = {
  id: number
  userId: number
  vehicleType: string | null
  vehiclePlate: string | null
  phone: string | null
  isAvailable: boolean
}

async function handleAdminResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let bodyText = ''
    try {
      bodyText = await res.text()
    } catch {
      // ignore
    }
    if (bodyText) {
      try {
        const j = JSON.parse(bodyText)
        const msg = (j && (j.detail || j.message)) || bodyText
        throw new Error(String(msg))
      } catch {
        throw new Error(bodyText)
      }
    }
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  })
  return handleAdminResponse<T>(res)
}

export function fetchAdminMetrics(): Promise<AdminMetrics> {
  return adminFetch<AdminMetrics>('/admin/metrics')
}

export function fetchAdminCollections(status?: string): Promise<AdminCollection[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return adminFetch<AdminCollection[]>(`/admin/collections${qs}`)
}

export function fetchAdminDrivers(): Promise<AdminDriver[]> {
  return adminFetch<AdminDriver[]>('/admin/drivers')
}

export function createAdminDriver(data: {
  email: string
  password: string
  fullName?: string
  vehicleType?: string
  vehiclePlate?: string
  phone?: string
}): Promise<AdminDriver> {
  return adminFetch<AdminDriver>('/admin/drivers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function assignDriverToCollection(collectionId: number, driverId: number): Promise<AdminCollection> {
  return adminFetch<AdminCollection>(`/admin/collections/${collectionId}/assign-driver`, {
    method: 'PATCH',
    body: JSON.stringify({ driverId }),
  })
}

export function processCollection(collectionId: number): Promise<AdminCollection> {
  return adminFetch<AdminCollection>(`/admin/collections/${collectionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'processed' }),
  })
}
