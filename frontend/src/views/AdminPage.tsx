import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  fetchAdminCollections,
  fetchAdminMetrics,
  fetchAdminDrivers,
  createAdminDriver,
  assignDriverToCollection,
  processCollection,
  fetchDriverEarnings,
  createDriverPayout,
  fetchAllPayouts,
  generateCollections,
  fetchAdminClaims,
  updateClaimStatus,
  sendAdminNotification,
  fetchAdminNotifications,
  type AdminCollection,
  type AdminMetrics,
  type AdminDriver,
  type AdminClaim,
  type AdminNotification,
} from '../lib/adminApi'
import type { DriverEarningsBalance, DriverPayout } from '../types/api'
import { MetricCard } from '../components/MetricCard'

const DRIVER_ZONES = ['Dublin 1', 'Dublin 2-4', 'Dublin 6-8', 'South County', 'North County']

type Tab = 'collections' | 'drivers' | 'payouts' | 'claims' | 'notifications'
type StatusFilter = 'all' | 'scheduled' | 'assigned' | 'collected' | 'completed' | 'cancelled'

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('collections')
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [drivers, setDrivers] = useState<AdminDriver[]>([])
  const [payouts, setPayouts] = useState<DriverPayout[]>([])
  const [selectedPayoutDriverId, setSelectedPayoutDriverId] = useState<number | null>(null)
  const [selectedDriverEarnings, setSelectedDriverEarnings] = useState<DriverEarningsBalance | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [driversLoading, setDriversLoading] = useState(true)
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [driverEarningsLoading, setDriverEarningsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [generateLoading, setGenerateLoading] = useState(false)

  // Assign driver state (tracks which collection row has the dropdown open)
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Create driver form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '', password: '', fullName: '', vehicleType: '', vehiclePlate: '', phone: '', zone: '',
  })
  const [createLoading, setCreateLoading] = useState(false)

  // Payout form
  const [payoutAmountCents, setPayoutAmountCents] = useState('')
  const [payoutNote, setPayoutNote] = useState('')

  // Claims tab
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [claimsTotal, setClaimsTotal] = useState(0)
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [claimsStatusFilter, setClaimsStatusFilter] = useState<string>('all')
  const [claimActionLoading, setClaimActionLoading] = useState(false)
  const [responseInputs, setResponseInputs] = useState<Record<number, string>>({})

  // Notifications tab
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifForm, setNotifForm] = useState({ title: '', body: '', userId: '' })
  const [notifSending, setNotifSending] = useState(false)

  const statusParam = useMemo(() => {
    if (statusFilter === 'all') return undefined
    if (statusFilter === 'completed') return 'completed'
    if (statusFilter === 'cancelled') return 'canceled'
    return statusFilter
  }, [statusFilter])

  // Fetch metrics
  useEffect(() => {
    setMetricsLoading(true)
    fetchAdminMetrics()
      .then((m) => setMetrics(m))
      .catch((e: any) => {
        const msg = e?.message || 'Failed to load admin metrics'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setMetricsLoading(false))
  }, [])

  // Fetch collections
  const refreshCollections = () => {
    setCollectionsLoading(true)
    fetchAdminCollections(statusParam)
      .then((rows) => setCollections(rows))
      .catch((e: any) => {
        const msg = e?.message || 'Failed to load collections'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setCollectionsLoading(false))
  }

  useEffect(() => {
    refreshCollections()
  }, [statusParam])

  // Fetch drivers (needed for assign dropdown + drivers tab)
  const refreshDrivers = () => {
    setDriversLoading(true)
    fetchAdminDrivers()
      .then((rows) => setDrivers(rows))
      .catch((e: any) => {
        toast.error(e?.message || 'Failed to load drivers')
      })
      .finally(() => setDriversLoading(false))
  }

  useEffect(() => {
    refreshDrivers()
  }, [])

  const refreshAllPayouts = () => {
    setPayoutsLoading(true)
    fetchAllPayouts()
      .then((rows) => setPayouts(rows))
      .catch((e: any) => {
        toast.error(e?.message || 'Failed to load payouts')
      })
      .finally(() => setPayoutsLoading(false))
  }

  useEffect(() => {
    refreshAllPayouts()
  }, [])

  const refreshClaims = () => {
    setClaimsLoading(true)
    const status = claimsStatusFilter === 'all' ? undefined : claimsStatusFilter
    fetchAdminClaims(status)
      .then((res) => {
        setClaims(res.items)
        setClaimsTotal(res.total)
      })
      .catch((e: unknown) => toast.error((e as Error)?.message || 'Failed to load claims'))
      .finally(() => setClaimsLoading(false))
  }

  useEffect(() => {
    if (tab === 'claims') refreshClaims()
  }, [tab, claimsStatusFilter])

  const refreshAdminNotifications = () => {
    setNotifLoading(true)
    fetchAdminNotifications()
      .then((res) => setAdminNotifications(res.items))
      .catch((e: unknown) => toast.error((e as Error)?.message || 'Failed to load notifications'))
      .finally(() => setNotifLoading(false))
  }

  useEffect(() => {
    if (tab === 'notifications') refreshAdminNotifications()
  }, [tab])

  const refreshSelectedDriverEarnings = async (driverId: number) => {
    setDriverEarningsLoading(true)
    try {
      const res = await fetchDriverEarnings(driverId)
      setSelectedDriverEarnings(res)
      setPayoutAmountCents(String(res.balanceCents || 0))
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load driver earnings')
    } finally {
      setDriverEarningsLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'payouts') return
    if (selectedPayoutDriverId) {
      refreshSelectedDriverEarnings(selectedPayoutDriverId)
      return
    }
    if (drivers.length > 0) {
      setSelectedPayoutDriverId(drivers[0].id)
    }
  }, [tab, drivers, selectedPayoutDriverId])

  const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

  // --- Actions ---
  const handleAssignDriver = async (collectionId: number) => {
    if (!selectedDriverId) return
    setActionLoading(true)
    try {
      await assignDriverToCollection(collectionId, selectedDriverId)
      toast.success(`Driver assigned to collection #${collectionId}`)
      setAssigningId(null)
      setSelectedDriverId(null)
      refreshCollections()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign driver')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateCollections = async () => {
    setGenerateLoading(true)
    try {
      const res = await generateCollections()
      toast.success(`Generated ${res.generated} collections, skipped ${res.skipped} (already existed)`)
      refreshCollections()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate collections')
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleProcess = async (collectionId: number) => {
    setActionLoading(true)
    try {
      await processCollection(collectionId)
      toast.success(`Collection #${collectionId} completed — wallet credited`)
      refreshCollections()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process collection')
    } finally {
      setActionLoading(false)
    }
  }

  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayoutDriverId) return
    const amt = Number(payoutAmountCents || 0)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Amount must be > 0')
      return
    }
    setActionLoading(true)
    try {
      await createDriverPayout(selectedPayoutDriverId, Math.floor(amt), payoutNote || undefined)
      toast.success('Payout recorded')
      await refreshSelectedDriverEarnings(selectedPayoutDriverId)
      refreshAllPayouts()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process payout')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateClaimStatus = async (claimId: number, status: string) => {
    setClaimActionLoading(true)
    try {
      await updateClaimStatus(claimId, status, responseInputs[claimId] || undefined)
      toast.success(`Claim #${claimId} updated to ${status}`)
      refreshClaims()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Failed to update claim')
    } finally {
      setClaimActionLoading(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifForm.title || !notifForm.body) {
      toast.error('Title and body are required')
      return
    }
    const userId = notifForm.userId ? Number(notifForm.userId) : null
    setNotifSending(true)
    try {
      await sendAdminNotification(notifForm.title, notifForm.body, userId)
      toast.success(userId ? `Notification sent to user #${userId}` : 'Broadcast sent to all users')
      setNotifForm({ title: '', body: '', userId: '' })
      refreshAdminNotifications()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Failed to send notification')
    } finally {
      setNotifSending(false)
    }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required')
      return
    }
    setCreateLoading(true)
    try {
      await createAdminDriver({
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName || undefined,
        vehicleType: createForm.vehicleType || undefined,
        vehiclePlate: createForm.vehiclePlate || undefined,
        phone: createForm.phone || undefined,
        zone: createForm.zone || undefined,
      })
      toast.success('Driver created')
      setCreateForm({ email: '', password: '', fullName: '', vehicleType: '', vehiclePlate: '', phone: '', zone: '' })
      setShowCreateForm(false)
      refreshDrivers()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create driver')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-sm opacity-70 mb-4">
        Admin area is restricted to staff accounts.
      </p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Metrics */}
      <Tooltip.Provider delayDuration={200}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
          <MetricCard
            title="Total users"
            value={metricsLoading ? '—' : String(metrics?.users_total ?? 0)}
            tooltip="Total number of registered users in the platform"
          />
          <MetricCard
            title="Active subscriptions"
            value={metricsLoading ? '—' : String(metrics?.active_subscriptions ?? 0)}
            tooltip="Number of users with currently active subscription plans (weekly, monthly, or yearly)"
          />
          <MetricCard
            title="Total collections"
            value={metricsLoading ? '—' : String(metrics?.collections_total ?? 0)}
            tooltip="Total number of bottle collection requests created by users"
          />
          <MetricCard
            title="Scheduled collections"
            value={metricsLoading ? '—' : String(metrics?.collections_scheduled ?? 0)}
            tooltip="Collections that are scheduled but not yet completed or cancelled"
          />
          <MetricCard
            title="Total voucher value"
            value={metricsLoading ? '—' : formatCents(metrics?.voucher_total_cents ?? 0)}
            tooltip="Total value of all completed collection vouchers in euros"
          />
          <MetricCard
            title="Recurring schedules"
            value={metricsLoading ? '—' : String(metrics?.total_recurring_schedules ?? 0)}
            tooltip="Number of active recurring collection schedules. Users can set up automatic weekly or fortnightly pickups"
          />
          <MetricCard
            title="Subscription revenue"
            value={metricsLoading ? '—' : formatCents(metrics?.total_subscription_revenue_cents ?? 0)}
            tooltip="Total monthly recurring revenue from all active subscriptions combined"
          />
          <MetricCard
            title="Driver earnings"
            value={metricsLoading ? '—' : formatCents(metrics?.total_driver_earnings_cents ?? 0)}
            tooltip="Total amount earned by drivers from completed collections"
          />
          <MetricCard
            title="Driver payouts"
            value={metricsLoading ? '—' : formatCents(metrics?.total_driver_payouts_cents ?? 0)}
            tooltip="Total amount paid out to drivers"
          />
          <MetricCard
            title="Available payout balance"
            value={metricsLoading ? '—' : formatCents(metrics?.available_payout_balance_cents ?? 0)}
            tooltip="Remaining balance available for driver payouts (Subscription revenue - Driver payouts)"
          />
        </div>
      </Tooltip.Provider>

      {/* Recurring Schedules summary */}
      {metrics && (
        <div className="border rounded-md p-4 mb-6">
          <h2 className="font-semibold mb-2">Recurring Schedules</h2>
          <div className="text-sm opacity-70 mb-2">
            Total: <span className="font-medium text-foreground">{metrics.total_recurring_schedules ?? 0}</span> active
            schedules
          </div>
          {metrics.recurring_schedules_by_frequency &&
            Object.keys(metrics.recurring_schedules_by_frequency).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.recurring_schedules_by_frequency).map(([freq, count]) => (
                  <span
                    key={freq}
                    className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs"
                  >
                    {freq}: {count}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}


      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        <TabButton active={tab === 'collections'} onClick={() => setTab('collections')}>Collections</TabButton>
        <TabButton active={tab === 'drivers'} onClick={() => setTab('drivers')}>Drivers</TabButton>
        <TabButton active={tab === 'payouts'} onClick={() => setTab('payouts')}>Payouts</TabButton>
        <TabButton active={tab === 'claims'} onClick={() => setTab('claims')}>Claims</TabButton>
        <TabButton active={tab === 'notifications'} onClick={() => setTab('notifications')}>Notifications</TabButton>
      </div>

      {/* ====== COLLECTIONS TAB ====== */}
      {tab === 'collections' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-semibold">Collections</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateCollections}
                disabled={generateLoading}
                className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {generateLoading ? 'Generating…' : 'Generate Recurring Collections'}
              </button>
              <label className="text-sm opacity-70">Status</label>
              <select
                className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="assigned">Assigned</option>
                <option value="collected">Collected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            {collectionsLoading ? (
              <div className="p-3 text-sm opacity-70">Loading collections…</div>
            ) : collections.length === 0 ? (
              <div className="p-3 text-sm opacity-70">No collections found.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2">ID</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Material</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Return Pt</th>
                      <th className="p-2">Scheduled</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Bags</th>
                      <th className="p-2">Driver</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">{c.id}</td>
                        <td className="p-2">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${c.collection_slot_id != null ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {c.collection_slot_id != null ? 'Recurring' : 'One-off'}
                          </span>
                        </td>
                        <td className="p-2">
                          <CollectionTypeBadge type={c.collection_type} />
                        </td>
                        <td className="p-2">#{c.user_id}</td>
                        <td className="p-2">#{c.return_point_id}</td>
                        <td className="p-2">{new Date(c.scheduled_at).toLocaleString()}</td>
                        <td className="p-2">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="p-2">{c.bag_count}</td>
                        <td className="p-2">
                          {c.driver_id ? (
                            <span className="text-xs">Driver #{c.driver_id}</span>
                          ) : (
                            <span className="text-xs opacity-50">Unassigned</span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {/* Assign driver action — for scheduled (unassigned) collections */}
                            {c.status === 'scheduled' && !c.driver_id && (
                              assigningId === c.id ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    className="border rounded px-1 py-0.5 text-xs bg-transparent dark:bg-gray-900"
                                    value={selectedDriverId ?? ''}
                                    onChange={(e) => setSelectedDriverId(Number(e.target.value) || null)}
                                  >
                                    <option value="">Select…</option>
                                    {drivers.map((d) => (
                                      <option key={d.id} value={d.id}>
                                        #{d.id} {d.vehiclePlate || d.phone || `Driver ${d.id}`}{d.zone ? ` [${d.zone}]` : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleAssignDriver(c.id)}
                                    disabled={!selectedDriverId || actionLoading}
                                    className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => { setAssigningId(null); setSelectedDriverId(null) }}
                                    className="text-xs px-1 py-0.5 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setAssigningId(c.id); setSelectedDriverId(null) }}
                                  className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  Assign
                                </button>
                              )
                            )}

                            {/* Complete action — for collected collections */}
                            {c.status === 'collected' && (
                              <button
                                onClick={() => handleProcess(c.id)}
                                disabled={actionLoading}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ====== DRIVERS TAB ====== */}
      {tab === 'drivers' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-semibold">Drivers</div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {showCreateForm ? 'Cancel' : '+ New Driver'}
            </button>
          </div>

          {/* Create driver form */}
          {showCreateForm && (
            <form onSubmit={handleCreateDriver} className="border rounded-md p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1">Email *</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="driver@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Password *</label>
                <input
                  type="password"
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Full Name</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="John Driver"
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Vehicle Type</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.vehicleType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  placeholder="Van"
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Vehicle Plate</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.vehiclePlate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
                  placeholder="D-123-ABC"
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Phone</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="555-0100"
                />
              </div>
              <div>
                <label className="block text-xs opacity-70 mb-1">Zone</label>
                <select
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={createForm.zone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, zone: e.target.value }))}
                >
                  <option value="">— unassigned —</option>
                  {DRIVER_ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="text-sm px-4 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {createLoading ? 'Creating…' : 'Create Driver'}
                </button>
              </div>
            </form>
          )}

          {/* Drivers table */}
          <div className="border rounded-md overflow-hidden">
            {driversLoading ? (
              <div className="p-3 text-sm opacity-70">Loading drivers…</div>
            ) : drivers.length === 0 ? (
              <div className="p-3 text-sm opacity-70">No drivers found. Create one above.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2">ID</th>
                      <th className="p-2">User ID</th>
                      <th className="p-2">Vehicle Type</th>
                      <th className="p-2">Vehicle Plate</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Zone</th>
                      <th className="p-2">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="p-2">{d.id}</td>
                        <td className="p-2">#{d.userId}</td>
                        <td className="p-2">{d.vehicleType || '—'}</td>
                        <td className="p-2">{d.vehiclePlate || '—'}</td>
                        <td className="p-2">{d.phone || '—'}</td>
                        <td className="p-2">
                          {d.zone ? (
                            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              {d.zone}
                            </span>
                          ) : (
                            <span className="text-xs opacity-40">—</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              d.isAvailable
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {d.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ====== PAYOUTS TAB ====== */}
      {tab === 'payouts' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-semibold">Driver Payouts</div>
          </div>

          <div className="border rounded-md p-4 mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs opacity-70 mb-1">Driver</label>
                <select
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={selectedPayoutDriverId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value) || null
                    setSelectedPayoutDriverId(id)
                    setSelectedDriverEarnings(null)
                    if (id) refreshSelectedDriverEarnings(id)
                  }}
                >
                  <option value="">Select…</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      Driver #{d.id} ({d.vehiclePlate || d.phone || `user #${d.userId}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <div className="text-xs opacity-70">Balance</div>
                <div className="text-lg font-semibold">
                  {driverEarningsLoading ? '—' : `€${(((selectedDriverEarnings?.balanceCents ?? 0) as number) / 100).toFixed(2)}`}
                </div>
              </div>
            </div>

            <form onSubmit={handleProcessPayout} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1">Amount (cents)</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={payoutAmountCents}
                  onChange={(e) => setPayoutAmountCents(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs opacity-70 mb-1">Note (optional)</label>
                <input
                  className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="e.g. Weekly payout"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={!selectedPayoutDriverId || actionLoading}
                  className="text-sm px-4 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing…' : 'Process Payout'}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-md overflow-hidden">
              <div className="p-2 text-sm font-medium bg-gray-100 dark:bg-gray-800">Selected driver earnings</div>
              {driverEarningsLoading ? (
                <div className="p-3 text-sm opacity-70">Loading…</div>
              ) : !selectedDriverEarnings ? (
                <div className="p-3 text-sm opacity-70">Select a driver to view earnings.</div>
              ) : selectedDriverEarnings.earnings.length === 0 ? (
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
                      {selectedDriverEarnings.earnings.map((er) => (
                        <tr key={er.id} className="border-t">
                          <td className="p-2">{new Date(er.createdAt).toLocaleString()}</td>
                          <td className="p-2">#{er.collectionId}</td>
                          <td className="p-2">€{(er.amountCents / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="p-2 text-sm font-medium bg-gray-100 dark:bg-gray-800">Payouts history (all drivers)</div>
              {payoutsLoading ? (
                <div className="p-3 text-sm opacity-70">Loading payouts…</div>
              ) : payouts.length === 0 ? (
                <div className="p-3 text-sm opacity-70">No payouts recorded.</div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/40">
                        <th className="p-2">Date</th>
                        <th className="p-2">Driver</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="p-2">#{p.driverId}</td>
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
        </>
      )}

      {/* ====== CLAIMS TAB ====== */}
      {tab === 'claims' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-semibold">Claims ({claimsTotal})</div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-70">Status</label>
              <select
                className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={claimsStatusFilter}
                onChange={(e) => setClaimsStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            {claimsLoading ? (
              <div className="p-3 text-sm opacity-70">Loading claims…</div>
            ) : claims.length === 0 ? (
              <div className="p-3 text-sm opacity-70">No claims found.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2">ID</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Admin Response</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((c) => (
                      <tr key={c.id} className="border-t align-top">
                        <td className="p-2">{c.id}</td>
                        <td className="p-2">#{c.userId}</td>
                        <td className="p-2 max-w-xs">
                          <div className="line-clamp-2 text-xs">{c.description}</div>
                          {c.imageUrl && (
                            <a
                              href={c.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View image
                            </a>
                          )}
                        </td>
                        <td className="p-2">
                          <ClaimStatusBadge status={c.status} />
                        </td>
                        <td className="p-2 text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-xs max-w-xs">
                          <textarea
                            className="w-full border rounded px-1 py-0.5 text-xs bg-transparent dark:bg-gray-900 resize-none"
                            rows={2}
                            placeholder="Write response…"
                            value={responseInputs[c.id] ?? c.adminResponse ?? ''}
                            onChange={(e) =>
                              setResponseInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-1">
                            {c.status !== 'in_review' && (
                              <button
                                onClick={() => handleUpdateClaimStatus(c.id, 'in_review')}
                                disabled={claimActionLoading}
                                className="text-xs px-2 py-0.5 rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
                              >
                                In Review
                              </button>
                            )}
                            {c.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateClaimStatus(c.id, 'resolved')}
                                disabled={claimActionLoading}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ====== NOTIFICATIONS TAB ====== */}
      {tab === 'notifications' && (
        <>
          <div className="font-semibold mb-3">Send Notification</div>
          <form
            onSubmit={handleSendNotification}
            className="border rounded-md p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="block text-xs opacity-70 mb-1">Title *</label>
              <input
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                value={notifForm.title}
                onChange={(e) => setNotifForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Service update"
                required
              />
            </div>
            <div>
              <label className="block text-xs opacity-70 mb-1">
                User ID (leave blank to broadcast to all)
              </label>
              <input
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
                value={notifForm.userId}
                onChange={(e) => setNotifForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="e.g. 42 — or empty for broadcast"
                type="number"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs opacity-70 mb-1">Body *</label>
              <textarea
                className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900 resize-none"
                rows={3}
                value={notifForm.body}
                onChange={(e) => setNotifForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Notification message…"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={notifSending}
                className="text-sm px-4 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {notifSending ? 'Sending…' : 'Send Notification'}
              </button>
            </div>
          </form>

          <div className="font-semibold mb-3">Sent Notifications</div>
          <div className="border rounded-md overflow-hidden">
            {notifLoading ? (
              <div className="p-3 text-sm opacity-70">Loading…</div>
            ) : adminNotifications.length === 0 ? (
              <div className="p-3 text-sm opacity-70">No notifications sent yet.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2">ID</th>
                      <th className="p-2">Recipient</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Body</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminNotifications.map((n) => (
                      <tr key={n.id} className="border-t">
                        <td className="p-2">{n.id}</td>
                        <td className="p-2">
                          {n.userId ? (
                            `User #${n.userId}`
                          ) : (
                            <span className="text-xs opacity-70 italic">Broadcast</span>
                          )}
                        </td>
                        <td className="p-2 font-medium">{n.title}</td>
                        <td className="p-2 text-xs opacity-80 max-w-xs line-clamp-2">{n.body}</td>
                        <td className="p-2 text-xs">{new Date(n.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
      active
        ? 'border-emerald-600 text-emerald-600'
        : 'border-transparent opacity-70 hover:opacity-100'
    }`}
  >
    {children}
  </button>
)

function CollectionTypeBadge({ type }: { type?: string | null }) {
  if (!type || type === 'bottles') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">🍼 Bottles</span>
  if (type === 'glass') return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">🪟 Glass</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">♻️ Both</span>
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    collected: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

const ClaimStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    open: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
