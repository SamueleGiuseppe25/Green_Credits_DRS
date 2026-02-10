import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  fetchAdminCollections,
  fetchAdminMetrics,
  fetchAdminDrivers,
  createAdminDriver,
  assignDriverToCollection,
  processCollection,
  type AdminCollection,
  type AdminMetrics,
  type AdminDriver,
} from '../lib/adminApi'

type Tab = 'collections' | 'drivers'
type StatusFilter = 'all' | 'scheduled' | 'assigned' | 'collected' | 'completed' | 'cancelled'

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('collections')
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [drivers, setDrivers] = useState<AdminDriver[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [driversLoading, setDriversLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Assign driver state (tracks which collection row has the dropdown open)
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Create driver form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '', password: '', fullName: '', vehicleType: '', vehiclePlate: '', phone: '',
  })
  const [createLoading, setCreateLoading] = useState(false)

  const statusParam = useMemo(() => {
    if (statusFilter === 'all') return undefined
    if (statusFilter === 'completed') return 'processed'
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

  const euro = useMemo(() => {
    const cents = metrics?.voucher_total_cents ?? 0
    return `€${(cents / 100).toFixed(2)}`
  }, [metrics])

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

  const handleProcess = async (collectionId: number) => {
    setActionLoading(true)
    try {
      await processCollection(collectionId)
      toast.success(`Collection #${collectionId} processed — wallet credited`)
      refreshCollections()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process collection')
    } finally {
      setActionLoading(false)
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
      })
      toast.success('Driver created')
      setCreateForm({ email: '', password: '', fullName: '', vehicleType: '', vehiclePlate: '', phone: '' })
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Kpi title="Total users" value={metricsLoading ? '—' : String(metrics?.users_total ?? 0)} />
        <Kpi title="Active subscriptions" value={metricsLoading ? '—' : String(metrics?.active_subscriptions ?? 0)} />
        <Kpi title="Total collections" value={metricsLoading ? '—' : String(metrics?.collections_total ?? 0)} />
        <Kpi title="Scheduled collections" value={metricsLoading ? '—' : String(metrics?.collections_scheduled ?? 0)} />
        <Kpi title="Total voucher value" value={metricsLoading ? '—' : euro} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        <TabButton active={tab === 'collections'} onClick={() => setTab('collections')}>Collections</TabButton>
        <TabButton active={tab === 'drivers'} onClick={() => setTab('drivers')}>Drivers</TabButton>
      </div>

      {/* ====== COLLECTIONS TAB ====== */}
      {tab === 'collections' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-semibold">Collections</div>
            <div className="flex items-center gap-2">
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
                                        #{d.id} {d.vehiclePlate || d.phone || `Driver ${d.id}`}
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

                            {/* Process action — for collected collections */}
                            {c.status === 'collected' && (
                              <button
                                onClick={() => handleProcess(c.id)}
                                disabled={actionLoading}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Process
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
                          {d.isAvailable ? (
                            <span className="text-xs text-green-600">Yes</span>
                          ) : (
                            <span className="text-xs text-red-600">No</span>
                          )}
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
    </section>
  )
}

const Kpi: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="border rounded-md p-3">
    <div className="text-xs opacity-70">{title}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
)

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
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
