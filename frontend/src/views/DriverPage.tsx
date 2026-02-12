import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../lib/api'
import {
  fetchDriverProfile,
  updateDriverProfile,
  fetchDriverCollections,
  markCollected,
  uploadProofImage,
  fetchDriverEarnings,
  fetchDriverPayouts,
} from '../lib/driverApi'
import type { DriverProfile, DriverCollection, DriverEarningsBalance, DriverPayout } from '../types/api'

export const DriverPage: React.FC = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [collections, setCollections] = useState<DriverCollection[]>([])
  const [earnings, setEarnings] = useState<DriverEarningsBalance | null>(null)
  const [payouts, setPayouts] = useState<DriverPayout[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'collected'>('all')

  // Profile edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ vehicleType: '', vehiclePlate: '', phone: '' })

  // Availability toggle
  const [toggleLoading, setToggleLoading] = useState(false)

  // Mark collected modal
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null)
  const [voucherEuros, setVoucherEuros] = useState<string>('')
  const [markingPhase, setMarkingPhase] = useState<'idle' | 'uploading' | 'submitting'>('idle')

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }

    const next = URL.createObjectURL(proofFile)
    setProofPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return next
    })

    return () => {
      URL.revokeObjectURL(next)
    }
  }, [proofFile])

  useEffect(() => {
    setProfileLoading(true)
    fetchDriverProfile()
      .then((p) => {
        setProfile(p)
        setEditForm({
          vehicleType: p.vehicleType || '',
          vehiclePlate: p.vehiclePlate || '',
          phone: p.phone || '',
        })
      })
      .catch((e: any) => {
        setError(e?.message || 'Failed to load profile')
        toast.error(e?.message || 'Failed to load profile')
      })
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    setCollectionsLoading(true)
    const status = statusFilter === 'all' ? undefined : statusFilter
    fetchDriverCollections(status)
      .then((rows) => setCollections(rows))
      .catch((e: any) => {
        toast.error(e?.message || 'Failed to load collections')
      })
      .finally(() => setCollectionsLoading(false))
  }, [statusFilter])

  const refreshEarnings = async () => {
    setEarningsLoading(true)
    try {
      const res = await fetchDriverEarnings()
      setEarnings(res)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load earnings')
    } finally {
      setEarningsLoading(false)
    }
  }

  const refreshPayouts = async () => {
    setPayoutsLoading(true)
    try {
      const res = await fetchDriverPayouts()
      setPayouts(res)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load payouts')
    } finally {
      setPayoutsLoading(false)
    }
  }

  useEffect(() => {
    refreshEarnings()
    refreshPayouts()
  }, [])

  const toggleAvailability = async () => {
    if (profile === null || toggleLoading) return
    const next = !profile.isAvailable
    setToggleLoading(true)
    try {
      const updated = await updateDriverProfile({ isAvailable: next })
      setProfile(updated)
      toast.success(next ? 'You are now available' : 'You are now not available')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update availability')
    } finally {
      setToggleLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updated = await updateDriverProfile({
        vehicleType: editForm.vehicleType || null,
        vehiclePlate: editForm.vehiclePlate || null,
        phone: editForm.phone || null,
      })
      setProfile(updated)
      setEditing(false)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update profile')
    }
  }

  const handleMarkCollected = async () => {
    if (markingId === null) return
    try {
      if (!proofFile) {
        toast.error('Please select a proof image (JPG/PNG).')
        return
      }

      const eur = Number(voucherEuros)
      if (!Number.isFinite(eur) || eur <= 0) {
        toast.error('Please enter a valid voucher total (> €0).')
        return
      }
      if (eur > 500) {
        toast.error('Voucher total must be ≤ €500.')
        return
      }
      const voucherAmountCents = Math.round(eur * 100)

      setMarkingPhase('uploading')
      const { url } = await uploadProofImage(proofFile)

      setMarkingPhase('submitting')
      await markCollected(markingId, voucherAmountCents, url)
      toast.success('Collection marked as collected')
      setMarkingId(null)
      setProofFile(null)
      setVoucherEuros('')
      // Refresh collections
      const status = statusFilter === 'all' ? undefined : statusFilter
      const rows = await fetchDriverCollections(status)
      setCollections(rows)
      // Refresh earnings (an earning row is created on collected)
      refreshEarnings()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark collected')
    } finally {
      setMarkingPhase('idle')
    }
  }

  const balanceEuro = (() => {
    const cents = earnings?.balanceCents ?? 0
    return `€${(cents / 100).toFixed(2)}`
  })()

  return (
    <section>
      <h1 className="text-2xl font-bold">Driver Dashboard</h1>
      <p className="text-sm opacity-70 mb-4">Manage your profile and assigned collections.</p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Availability Toggle */}
      {!profileLoading && profile && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="font-medium">
            {profile.isAvailable ? 'Available' : 'Not Available'}
          </span>
          <button
            type="button"
            onClick={toggleAvailability}
            disabled={toggleLoading}
            className={`ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.isAvailable ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      )}

      {/* Profile Section */}
      <div className="border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">My Profile</h2>
          {!editing && !profileLoading && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Edit
            </button>
          )}
        </div>
        {profileLoading ? (
          <div className="text-sm opacity-70">Loading profile...</div>
        ) : editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs opacity-70 mb-1">Vehicle Type</label>
              <input
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                value={editForm.vehicleType}
                onChange={(e) => setEditForm((f) => ({ ...f, vehicleType: e.target.value }))}
                placeholder="e.g. Van"
              />
            </div>
            <div>
              <label className="block text-xs opacity-70 mb-1">Vehicle Plate</label>
              <input
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                value={editForm.vehiclePlate}
                onChange={(e) => setEditForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
                placeholder="e.g. ABC 123"
              />
            </div>
            <div>
              <label className="block text-xs opacity-70 mb-1">Phone</label>
              <input
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 555-0100"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2 mt-1">
              <button
                onClick={handleSaveProfile}
                className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ProfileField label="Vehicle Type" value={profile?.vehicleType} />
            <ProfileField label="Vehicle Plate" value={profile?.vehiclePlate} />
            <ProfileField label="Phone" value={profile?.phone} />
          </div>
        )}
      </div>

      {/* Collections Section */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-semibold">My Collections</div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70">Status</label>
          <select
            className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="collected">Collected</option>
          </select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        {collectionsLoading ? (
          <div className="p-3 text-sm opacity-70">Loading collections...</div>
        ) : collections.length === 0 ? (
          <div className="p-3 text-sm opacity-70">No collections found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-2">ID</th>
                  <th className="p-2">Scheduled</th>
                  <th className="p-2">Return Point</th>
                  <th className="p-2">Bags</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Proof</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{new Date(c.scheduledAt).toLocaleString()}</td>
                    <td className="p-2">#{c.returnPointId}</td>
                    <td className="p-2">{c.bagCount}</td>
                    <td className="p-2">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-2">
                      {c.proofUrl ? (
                        <a
                          href={c.proofUrl.startsWith('/') ? `${API_BASE_URL}${c.proofUrl}` : c.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs opacity-50">None</span>
                      )}
                    </td>
                    <td className="p-2">
                      {c.status === 'assigned' && (
                        <button
                          onClick={() => {
                            setMarkingId(c.id)
                            setProofFile(null)
                            setVoucherEuros('')
                          }}
                          className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Mark Collected
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Collected Modal */}
      {markingId !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              if (markingPhase === 'idle') {
                setMarkingId(null)
                setProofFile(null)
                setVoucherEuros('')
              }
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-3">Mark Collection #{markingId} as Collected</h3>
              <label className="block text-sm opacity-70 mb-1">Voucher Total (€) *</label>
              <input
                type="number"
                inputMode="decimal"
                min={0.01}
                max={500}
                step={0.01}
                className="w-full border rounded px-2 py-1.5 mb-3 bg-transparent dark:bg-gray-900"
                disabled={markingPhase !== 'idle'}
                value={voucherEuros}
                onChange={(e) => setVoucherEuros(e.target.value)}
                placeholder="e.g. 12.50"
              />
              <label className="block text-sm opacity-70 mb-1">Proof image (JPG/PNG, max 5MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="w-full border rounded px-2 py-1.5 mb-3 bg-transparent dark:bg-gray-900"
                disabled={markingPhase !== 'idle'}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setProofFile(f)
                }}
              />
              {proofPreviewUrl && (
                <div className="mb-4">
                  <div className="text-xs opacity-70 mb-1">Preview</div>
                  <img
                    src={proofPreviewUrl}
                    alt="Proof preview"
                    className="w-full max-h-64 object-contain rounded border bg-white"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setMarkingId(null)
                    setProofFile(null)
                    setVoucherEuros('')
                  }}
                  disabled={markingPhase !== 'idle'}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkCollected}
                  disabled={markingPhase !== 'idle'}
                  className="text-sm px-4 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {markingPhase === 'uploading'
                    ? 'Uploading...'
                    : markingPhase === 'submitting'
                      ? 'Submitting...'
                      : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Earnings Section */}
      <div className="border rounded-md p-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Earnings</h2>
          <div className="text-sm">
            Balance: <span className="font-semibold">{earningsLoading ? '—' : balanceEuro}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border rounded-md overflow-hidden">
            <div className="p-2 text-sm font-medium bg-gray-100 dark:bg-gray-800">Earnings history</div>
            {earningsLoading ? (
              <div className="p-3 text-sm opacity-70">Loading earnings…</div>
            ) : (earnings?.earnings?.length ?? 0) === 0 ? (
              <div className="p-3 text-sm opacity-70">No earnings yet.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/40">
                      <th className="p-2">Date</th>
                      <th className="p-2">Collection</th>
                      <th className="p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings!.earnings.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="p-2">{new Date(e.createdAt).toLocaleString()}</td>
                        <td className="p-2">#{e.collectionId}</td>
                        <td className="p-2">€{(e.amountCents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="p-2 text-sm font-medium bg-gray-100 dark:bg-gray-800">Payouts history</div>
            {payoutsLoading ? (
              <div className="p-3 text-sm opacity-70">Loading payouts…</div>
            ) : payouts.length === 0 ? (
              <div className="p-3 text-sm opacity-70">No payouts yet.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/40">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
                        <td className="p-2">€{(p.amountCents / 100).toFixed(2)}</td>
                        <td className="p-2 text-xs opacity-80">{p.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const ProfileField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <div className="text-xs opacity-70">{label}</div>
    <div className="text-sm font-medium">{value || <span className="opacity-50">Not set</span>}</div>
  </div>
)

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    collected: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    processed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
