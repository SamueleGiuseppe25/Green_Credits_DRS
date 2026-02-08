import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchAdminCollections, fetchAdminMetrics, type AdminCollection, type AdminMetrics } from '../lib/adminApi'

export const AdminPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI filter labels per prompt
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')

  const statusParam = useMemo(() => {
    if (statusFilter === 'all') return undefined
    if (statusFilter === 'completed') return 'processed'
    if (statusFilter === 'cancelled') return 'canceled'
    return statusFilter
  }, [statusFilter])

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

  useEffect(() => {
    setCollectionsLoading(true)
    fetchAdminCollections(statusParam)
      .then((rows) => setCollections(rows))
      .catch((e: any) => {
        const msg = e?.message || 'Failed to load collections'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setCollectionsLoading(false))
  }, [statusParam])

  const euro = useMemo(() => {
    const cents = metrics?.voucher_total_cents ?? 0
    return `€${(cents / 100).toFixed(2)}`
  }, [metrics])

  return (
    <section>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-sm opacity-70 mb-4">
        Admin area is restricted to staff accounts.
      </p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Kpi title="Total users" value={metricsLoading ? '—' : String(metrics?.users_total ?? 0)} />
        <Kpi title="Active subscriptions" value={metricsLoading ? '—' : String(metrics?.active_subscriptions ?? 0)} />
        <Kpi title="Total collections" value={metricsLoading ? '—' : String(metrics?.collections_total ?? 0)} />
        <Kpi title="Scheduled collections" value={metricsLoading ? '—' : String(metrics?.collections_scheduled ?? 0)} />
        <Kpi title="Total voucher value" value={metricsLoading ? '—' : euro} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-semibold">Collections</div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70">Status</label>
          <select
            className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
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
                  <th className="p-2">User ID</th>
                  <th className="p-2">Return point ID</th>
                  <th className="p-2">Scheduled date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Bag count</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{c.user_id}</td>
                    <td className="p-2">{c.return_point_id}</td>
                    <td className="p-2">{new Date(c.scheduled_at).toLocaleString()}</td>
                    <td className="p-2">{c.status}</td>
                    <td className="p-2">{c.bag_count}</td>
                    <td className="p-2">{c.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

const Kpi: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="border rounded-md p-3">
    <div className="text-xs opacity-70">{title}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
)


