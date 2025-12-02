import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChoosePlan, useMySubscription } from '../hooks/useSubscription'
import toast from 'react-hot-toast'
import { apiFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth()
  const sub = useMySubscription()
  const choosePlan = useChoosePlan()
  const navigate = useNavigate()
  const [name, setName] = useState<string>(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Account</div>
          <form
            className="text-sm space-y-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                await apiFetch<{ ok: boolean }>('/users/me', {
                  method: 'PATCH',
                  body: JSON.stringify({ full_name: name || null }),
                })
                await refreshUser()
                toast.success('Account details updated')
              } catch (err: any) {
                toast.error(err?.message || 'Could not update account')
              } finally {
                setSaving(false)
              }
            }}
          >
            <div><span className="opacity-70">Email</span> {user?.email}</div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="opacity-70">Name</label>
              <input
                type="text"
                className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
                onClick={() => {
                  logout()
                  navigate('/', { replace: true })
                }}
              >
                Logout
              </button>
            </div>
          </form>
        </div>
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Subscription</div>
          {sub.isLoading && <div className="text-sm opacity-70">Loading…</div>}
          {sub.isError && <div className="text-sm text-red-600">Could not load subscription.</div>}
          {sub.data && sub.data.status === 'active' ? (
            <div className="text-sm space-y-1">
              <div><span className="opacity-70">Plan</span> {sub.data.planCode || '-'}</div>
              <div><span className="opacity-70">Status</span> {sub.data.status}</div>
              <div><span className="opacity-70">Since</span> {sub.data.startDate ? new Date(sub.data.startDate).toLocaleDateString() : '-'}</div>
              <div className="pt-2 flex gap-2">
                <button
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    const next = window.prompt('Change plan to: weekly, monthly, yearly?','monthly')
                    if (!next) return
                    choosePlan.mutate(next as any)
                  }}
                >
                  Change plan
                </button>
                <button
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/subscriptions/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('gc_access_token') || ''}` } })
                      if (!res.ok) throw new Error(await res.text())
                      toast.success('Subscription canceled')
                      sub.refetch()
                    } catch (e: any) {
                      toast.error(e?.message || 'Could not cancel subscription')
                    }
                  }}
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm opacity-70 mb-2">Choose a plan to activate your subscription:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['weekly','monthly','yearly'] as const).map((code) => (
                  <button
                    key={code}
                    className="border rounded px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => choosePlan.mutate(code)}
                    disabled={choosePlan.isPending}
                  >
                    <div className="font-semibold capitalize">{code}</div>
                    <div className="text-xs opacity-70">{code === 'weekly' ? '1 pickup/week' : code === 'monthly' ? 'Monthly plan' : 'Yearly plan'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Delete account</div>
          <div className="text-sm opacity-80 mb-2">
            Deleting your account requires no active subscription and no upcoming collections.
          </div>
          <button
            className="text-sm px-3 py-1 rounded border border-red-600 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            disabled={deleting}
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
              setDeleting(true)
              try {
                await apiFetch<void>('/users/me', { method: 'DELETE' })
                logout()
                navigate('/', { replace: true })
              } catch (err: any) {
                toast.error(err?.message || 'Could not delete account')
              } finally {
                setDeleting(false)
              }
            }}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </section>
  )
}


