import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthUser, getUser as fetchUser, getToken as readToken, login as doLogin, logout as doLogout, setToken as writeToken } from '../lib/auth'

type AuthContextValue = {
  user: AuthUser
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const u = await fetchUser()
      setUser(u)
      // If getUser returns null, token was invalid and already cleared by getUser()
      if (!u) {
        setToken(null)
      }
    } catch (error) {
      // Handle errors gracefully - don't crash the app
      console.error('Failed to refresh user:', error)
      setUser(null)
      setToken(null)
    }
  }, [])

  useEffect(() => {
    // Load persisted token and try to fetch current user
    const t = readToken()
    setToken(t)
    setLoading(true)
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const { token: t } = await doLogin(email, password)
      setToken(t)
      writeToken(t)
      await refreshUser()
    } catch (err: any) {
      // Set error message for display in login form
      setError(err?.message || 'Login failed')
      throw err // Re-throw so LoginPage can handle it
    }
  }, [refreshUser])

  const logout = useCallback(() => {
    doLogout()
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token && user)

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, error, isAuthenticated, login, logout, refreshUser }),
    [user, token, loading, error, isAuthenticated, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}



