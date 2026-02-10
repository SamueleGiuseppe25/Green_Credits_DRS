import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  fetchDriverProfile,
  updateDriverProfile,
  fetchDriverCollections,
  markCollected,
} from '../lib/driverApi'
import type { DriverProfile, DriverCollection } from '../types/api'

export const DriverPage: React.FC = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [collections, setCollections] = useState<DriverCollection[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'collected'>('all')

  // Profile edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ vehicleType: '', vehiclePlate: '', phone: '' })

  // Mark collected modal
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [markingLoading, setMarkingLoading] = useState(false)

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
    if (!markingId) return
    setMarkingLoading(true)
    try {
      await markCollected(markingId, proofUrl || undefined)
      toast.success('Collection marked as collected')
      setMarkingId(null)
      setProofUrl('')
      // Refresh collections
      const status = statusFilter === 'all' ? undefined : statusFilter
      const rows = await fetchDriverCollections(status)
      setCollections(rows)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark collected')
    } finally {
      setMarkingLoading(false)
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Driver Dashboard</h1>
      <p className="text-sm opacity-70 mb-4">Manage your profile and assigned collections.</p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

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
                        <a href={c.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                          View
                        </a>
                      ) : (
                        <span className="text-xs opacity-50">None</span>
                      )}
                    </td>
                    <td className="p-2">
                      {c.status === 'assigned' && (
                        <button
                          onClick={() => { setMarkingId(c.id); setProofUrl('') }}
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
            onClick={() => { if (!markingLoading) setMarkingId(null) }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-3">Mark Collection #{markingId} as Collected</h3>
              <label className="block text-sm opacity-70 mb-1">Proof URL (simulated image upload)</label>
              <input
                className="w-full border rounded px-2 py-1.5 mb-4 bg-transparent dark:bg-gray-900"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://example.com/proof-photo.jpg"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setMarkingId(null)}
                  disabled={markingLoading}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkCollected}
                  disabled={markingLoading}
                  className="text-sm px-4 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {markingLoading ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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
