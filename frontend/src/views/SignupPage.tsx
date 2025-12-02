import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const SignupPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/wallet', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName || null }),
      })
      if (!res.ok) {
        const msg = (await res.text()) || 'Registration failed'
        throw new Error(msg)
      }
      // Auto-login after successful signup
      await login(email, password)
      navigate('/settings', { replace: true })
      toast.success('Welcome to GreenCredits!')
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign up</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Full name (optional)</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 bg-transparent"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white rounded px-3 py-2 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </section>
  )
}




