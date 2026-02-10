import { API_BASE_URL } from './api'
import { getToken } from './auth'
import type { DriverProfile, DriverCollection } from '../types/api'

async function handleResponse<T>(res: Response): Promise<T> {
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

async function driverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  })
  return handleResponse<T>(res)
}

export function fetchDriverProfile(): Promise<DriverProfile> {
  return driverFetch<DriverProfile>('/drivers/me/profile')
}

export function updateDriverProfile(data: {
  vehicleType?: string | null
  vehiclePlate?: string | null
  phone?: string | null
  isAvailable?: boolean | null
}): Promise<DriverProfile> {
  return driverFetch<DriverProfile>('/drivers/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function fetchDriverCollections(status?: string): Promise<DriverCollection[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return driverFetch<DriverCollection[]>(`/drivers/me/collections${qs}`)
}

export function markCollected(id: number, proofUrl?: string): Promise<DriverCollection> {
  return driverFetch<DriverCollection>(`/drivers/me/collections/${id}/mark-collected`, {
    method: 'PATCH',
    body: JSON.stringify({ proofUrl: proofUrl || null }),
  })
}
