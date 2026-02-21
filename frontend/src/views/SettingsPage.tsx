import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMySubscription } from '../hooks/useSubscription'
import toast from 'react-hot-toast'
import { apiFetch } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '../lib/paymentsApi'

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth()
  const sub = useMySubscription()
  const navigate = useNavigate()
  const [name, setName] = useState<string>(user?.full_name || '')
  const [address, setAddress] = useState<string>(user?.address || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(user?.full_name || '')
    setAddress(user?.address || '')
  }, [user])
  const [deleting, setDeleting] = useState(false)
  const [showCancelSubModal, setShowCancelSubModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [cancelingSub, setCancelingSub] = useState(false)

  const handleCancelSubscription = async () => {
    setCancelingSub(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('gc_access_token') || ''}` },
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Subscription canceled')
      setShowCancelSubModal(false)
      sub.refetch()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Could not cancel subscription')
    } finally {
      setCancelingSub(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await apiFetch<void>('/users/me', { method: 'DELETE' })
      setShowDeleteModal(false)
      logout()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Could not delete account')
    } finally {
      setDeleting(false)
    }
  }

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
                  body: JSON.stringify({ full_name: name || null, address: address || null }),
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
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="opacity-70">Address</label>
              <input
                type="text"
                className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Home address for pickups"
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
              {sub.data.currentPeriodEnd ? (
                <div><span className="opacity-70">Active until</span> {new Date(sub.data.currentPeriodEnd).toLocaleDateString()}</div>
              ) : null}
              <div className="pt-2 flex gap-2">
                <button
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={async () => {
                    const next = window.prompt('Change plan to: weekly, monthly, yearly?', 'monthly')
                    if (!next) return
                    const plan = next.trim().toLowerCase()
                    if (plan !== 'weekly' && plan !== 'monthly' && plan !== 'yearly') {
                      toast.error('Invalid plan. Choose weekly, monthly, or yearly.')
                      return
                    }
                    const { url } = await createCheckoutSession(plan as any)
                    window.location.href = url
                  }}
                >
                  Change plan
                </button>
                <button
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowCancelSubModal(true)}
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
                    onClick={async () => {
                      try {
                        const { url } = await createCheckoutSession(code)
                        window.location.href = url
                      } catch (e: any) {
                        toast.error(e?.message || 'Could not start checkout')
                      }
                    }}
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
            onClick={() => setShowDeleteModal(true)}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelSubModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowCancelSubModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-3">Cancel Subscription?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your subscription will be cancelled immediately. You can resubscribe at any time.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCancelSubModal(false)}
                  disabled={cancelingSub}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelingSub}
                  className="text-sm px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelingSub ? 'Canceling…' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-3">Delete Account?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Keep Account
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="text-sm px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}


