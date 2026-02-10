import { getToken, logout } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function buildHeaders(init?: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token invalid/expired → log out and redirect to login
    logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    // Best-effort extract message, but read body ONCE to avoid stream reuse errors
    let bodyText = ''
    try {
      bodyText = await res.text()
    } catch {
      // ignore
    }
    let message = ''
    if (bodyText) {
      try {
        const j = JSON.parse(bodyText)
        message = (j && (j.detail || j.message)) || ''
      } catch {
        message = bodyText
      }
    }
    throw new Error(message || `Request failed: ${res.status}`)
  }

  // 204 No Content → resolve undefined
  if (res.status === 204) {
    return undefined as unknown as T
  }

  // If not JSON or empty body, avoid parsing error
  const contentLength = res.headers.get('content-length')
  const contentType = res.headers.get('content-type') || ''
  if (contentLength === '0' || (!contentType.includes('application/json'))) {
    try {
      const text = await res.text()
      if (!text) return undefined as unknown as T
      try {
        return JSON.parse(text) as T
      } catch {
        return undefined as unknown as T
      }
    } catch {
      return undefined as unknown as T
    }
  }

  return res.json() as Promise<T>
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
  })
  return handleResponse<T>(res)
}

export async function apiForm<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: form,
    ...init,
    headers,
  })
  return handleResponse<T>(res)
}

