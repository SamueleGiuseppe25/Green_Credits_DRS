export type LoginResponse = {
  accessToken: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
}

export type AuthUser = {
  id: number
  email: string
  name?: string
  role?: string
} | null

const TOKEN_KEY = 'authToken'

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

export async function login(email: string, password: string): Promise<{ token: string; raw: LoginResponse }>
{
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Login failed')
  }

  const data = (await res.json()) as LoginResponse
  const token = data.accessToken
  if (!token) throw new Error('Invalid auth response: missing accessToken')
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
    if (!res.ok) return null
    return (await res.json()) as AuthUser
  } catch {
    return null
  }
}



