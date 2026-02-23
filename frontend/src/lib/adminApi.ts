import { API_BASE_URL } from './api'
import { getToken } from './auth'
import type { DriverEarningsBalance, DriverPayout } from '../types/api'

export type AdminMetrics = {
  users_total: number
  active_subscriptions: number
  collections_total: number
  collections_scheduled: number
  voucher_total_cents: number
  total_recurring_schedules: number
  recurring_schedules_by_frequency: Record<string, number>
  total_subscription_revenue_cents: number
  total_driver_earnings_cents: number
  total_driver_payouts_cents: number
  available_payout_balance_cents: number
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
  collection_slot_id: number | null
}

export type AdminDriver = {
  id: number
  userId: number
  vehicleType: string | null
  vehiclePlate: string | null
  phone: string | null
  isAvailable: boolean
  zone: string | null
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
  zone?: string
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
    body: JSON.stringify({ status: 'completed' }),
  })
}

export function fetchDriverEarnings(driverId: number): Promise<DriverEarningsBalance> {
  return adminFetch<DriverEarningsBalance>(`/admin/drivers/${driverId}/earnings`)
}

export function createDriverPayout(driverId: number, amountCents: number, note?: string): Promise<DriverPayout> {
  return adminFetch<DriverPayout>(`/admin/drivers/${driverId}/payouts`, {
    method: 'POST',
    body: JSON.stringify({ amountCents, note: note || null }),
  })
}

export function fetchAllPayouts(): Promise<DriverPayout[]> {
  return adminFetch<DriverPayout[]>('/admin/payouts')
}

export type GenerateCollectionsResponse = {
  generated: number
  skipped: number
}

export function generateCollections(): Promise<GenerateCollectionsResponse> {
  return adminFetch<GenerateCollectionsResponse>('/admin/generate-collections', {
    method: 'POST',
  })
}

// ----- Claims admin -----
export type AdminClaim = {
  id: number
  userId: number
  description: string
  imageUrl: string | null
  status: string
  adminResponse: string | null
  createdAt: string
  updatedAt: string
}

export type AdminClaimsResponse = {
  items: AdminClaim[]
  total: number
}

export function fetchAdminClaims(
  status?: string,
  page = 1,
  pageSize = 20
): Promise<AdminClaimsResponse> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (status) params.set('status', status)
  return adminFetch<AdminClaimsResponse>(`/admin/claims?${params}`)
}

export function updateClaimStatus(
  claimId: number,
  status: string,
  adminResponse?: string
): Promise<AdminClaim> {
  return adminFetch<AdminClaim>(`/admin/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminResponse: adminResponse || null }),
  })
}

// ----- Notifications admin -----
export type AdminNotification = {
  id: number
  userId: number | null
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export type AdminNotificationsResponse = {
  items: AdminNotification[]
  total: number
}

export function sendAdminNotification(
  title: string,
  body: string,
  userId?: number | null
): Promise<AdminNotification> {
  return adminFetch<AdminNotification>('/admin/notifications', {
    method: 'POST',
    body: JSON.stringify({ title, body, userId: userId ?? null }),
  })
}

export function fetchAdminNotifications(
  page = 1,
  pageSize = 50
): Promise<AdminNotificationsResponse> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  return adminFetch<AdminNotificationsResponse>(`/admin/notifications?${params}`)
}
