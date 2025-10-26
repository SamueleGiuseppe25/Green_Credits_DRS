// frontend/src/lib/api.ts
const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

type ApiError = { status: number; message: string }

async function toApiError(res: Response): Promise<ApiError> {
  let msg = res.statusText
  try {
    const body = await res.json()
    msg = (body?.detail ?? body?.message ?? msg) as string
  } catch {}
  return { status: res.status, message: msg }
}

export async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('gc.token') ||
    ''

  const headers = new Headers(init.headers)
  // Only set JSON when not sending FormData
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (!headers.has('Content-Type') && !isFormData) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', token)

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  })

  if (!res.ok) throw await toApiError(res)
  return (res.status === 204 ? (undefined as unknown as T) : (await res.json())) as T
}

