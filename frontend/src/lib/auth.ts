// Backend returns snake_case (access_token), but we normalize to camelCase internally
export type LoginResponse = {
  access_token: string
  token_type?: string
}

export type AuthUser = {
  id: number
  email: string
  full_name?: string | null
  is_active?: boolean | null
  is_admin?: boolean | null
} | null

// Use gc_access_token as specified in requirements
const TOKEN_KEY = 'gc_access_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // ignore storage errors in restricted environments
  }
}

export function isAuthenticated(): boolean {
  // In MVP we only check presence; add JWT expiry validation if needed later
  return Boolean(getToken())
}

export async function login(email: string, password: string): Promise<{ token: string; raw: LoginResponse }> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    let errorMessage = 'Login failed'
    try {
      const errorData = await res.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      const errorText = await res.text()
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }

  const data = (await res.json()) as LoginResponse & { accessToken?: string }
  // Backend returns access_token (snake_case); mocks may return accessToken
  const token = data.access_token || data.accessToken
  if (!token) throw new Error('Invalid auth response: missing access_token')
  setToken(token)
  return { token, raw: data }
}

export function logout(): void {
  setToken(null)
}

export async function getUser(): Promise<AuthUser> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      // 401/403 means token is invalid - clear it
      if (res.status === 401 || res.status === 403) {
        setToken(null)
      }
      return null
    }
    return (await res.json()) as AuthUser
  } catch (error) {
    // Network errors or other issues - log but don't crash
    console.error('Failed to fetch user:', error)
    return null
  }
}



