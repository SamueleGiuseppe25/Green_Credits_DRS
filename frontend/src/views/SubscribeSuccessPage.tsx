import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiFetch } from '../lib/api'
import type { Subscription } from '../types/api'

export const SubscribeSuccessPage: React.FC = () => {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<Subscription | null>(null)

  useEffect(() => {
    setLoading(true)
    apiFetch<Subscription>('/subscriptions/me')
      .then((s) => setSub(s))
      .catch((e: any) => {
        toast.error(e?.message || 'Could not refresh subscription')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Subscription activated</h1>
      <p className="text-sm opacity-70 mb-4">
        Thanks! Your payment was completed{sessionId ? ` (session ${sessionId}).` : '.'}
      </p>
      {loading ? (
        <div className="text-sm opacity-70">Refreshing your subscription…</div>
      ) : sub ? (
        <div className="text-sm border rounded-md p-3 bg-gray-50 dark:bg-gray-800/40">
          <div><span className="opacity-70">Plan</span> {sub.planCode || '-'}</div>
          <div><span className="opacity-70">Status</span> {sub.status}</div>
          <div><span className="opacity-70">Since</span> {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}</div>
        </div>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Link className="text-sm px-3 py-1 rounded bg-emerald-600 text-white" to="/wallet">Go to wallet</Link>
        <Link className="text-sm px-3 py-1 rounded border" to="/settings">View settings</Link>
      </div>
    </section>
  )
}

