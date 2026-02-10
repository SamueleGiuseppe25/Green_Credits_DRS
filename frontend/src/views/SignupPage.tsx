import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { apiFetch } from '../lib/api'
import { createCheckoutSession } from '../lib/paymentsApi'

export const SignupPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [planCode, setPlanCode] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
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
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        toast.error('Email is required')
        return
      }
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password, full_name: fullName || null }),
      })
      // Auto-login after successful signup
      await login(normalizedEmail, password)
      const { url } = await createCheckoutSession(planCode)
      window.location.href = url
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
        <div>
          <label className="block text-sm mb-1">Plan</label>
          <select
            className="w-full border rounded px-3 py-2 bg-transparent dark:bg-gray-900 dark:text-gray-100"
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value as 'weekly' | 'monthly' | 'yearly')}
          >
            <option value="weekly">Weekly — 1 pickup/week</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
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




