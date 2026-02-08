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

async function adminFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

