import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = (location.state?.from as any)?.pathname || '/wallet'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      // Redirect to the page user tried to access, or default to /wallet
      const redirectTo = (location.state?.from as any)?.pathname || '/wallet'
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      const msg = err?.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded px-3 py-2 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}


