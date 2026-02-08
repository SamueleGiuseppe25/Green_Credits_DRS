import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { AdminMetrics, AdminCollectionRow } from '../types/api'

export const AdminPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [limit, setLimit] = useState(50)

  const ping = useQuery({
    queryKey: ['admin', 'ping'],
    queryFn: () => apiFetch<{ status: string }>('/admin/ping'),
    staleTime: 10_000,
  })

  const metrics = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => apiFetch<AdminMetrics>('/admin/metrics'),
    staleTime: 30_000,
    enabled: ping.isSuccess && ping.data?.status === 'ok',
  })

  const collectionsParams = new URLSearchParams()
  if (statusFilter) collectionsParams.set('status', statusFilter)
  collectionsParams.set('limit', String(limit))
  const collections = useQuery({
    queryKey: ['admin', 'collections', statusFilter, limit],
    queryFn: () => apiFetch<AdminCollectionRow[]>(`/admin/collections?${collectionsParams.toString()}`),
    staleTime: 15_000,
    enabled: ping.isSuccess && ping.data?.status === 'ok',
  })

  const formatEuro = (cents: number) => (cents / 100).toFixed(2)
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

  return (
    <section>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-sm opacity-70 mb-4">
        Admin area is restricted to staff accounts.
      </p>
      {ping.isSuccess && ping.data?.status === 'ok' && (
        <div className="mb-4 text-sm rounded border px-3 py-2 bg-gray-50 dark:bg-gray-800/40">
          Admin area – you are logged in as admin.
        </div>
      )}
      {ping.isError && (
        <div className="mb-4 text-sm text-red-600">Admin ping failed.</div>
      )}

      {metrics.isSuccess && metrics.data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="rounded border bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="text-xs opacity-70 uppercase">Users</div>
            <div className="text-xl font-semibold">{metrics.data.users_total}</div>
          </div>
          <div className="rounded border bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="text-xs opacity-70 uppercase">Active subs</div>
            <div className="text-xl font-semibold">{metrics.data.active_subscriptions}</div>
          </div>
          <div className="rounded border bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="text-xs opacity-70 uppercase">Collections</div>
            <div className="text-xl font-semibold">{metrics.data.collections_total}</div>
          </div>
          <div className="rounded border bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="text-xs opacity-70 uppercase">Scheduled</div>
            <div className="text-xl font-semibold">{metrics.data.collections_scheduled}</div>
          </div>
          <div className="rounded border bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="text-xs opacity-70 uppercase">Voucher total</div>
            <div className="text-xl font-semibold">€{formatEuro(metrics.data.voucher_total_cents)}</div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-2">Collections</h2>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm opacity-70">Status</label>
          <select
            className="border rounded px-2 py-1 bg-transparent text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="text-sm opacity-70">Limit</label>
          <select
            className="border rounded px-2 py-1 bg-transparent text-sm"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[20, 50, 100, 200].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        {collections.isLoading && <div className="text-sm opacity-70">Loading collections…</div>}
        {collections.isError && (
          <div className="text-sm text-red-600">Could not load collections.</div>
        )}
        {collections.isSuccess && collections.data && (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">User ID</th>
                  <th className="px-3 py-2">Return point</th>
                  <th className="px-3 py-2">Scheduled</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Bags</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {collections.data.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 opacity-70">No collections.</td></tr>
                ) : (
                  collections.data.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2">{c.id}</td>
                      <td className="px-3 py-2">{c.user_id}</td>
                      <td className="px-3 py-2">{c.return_point_id}</td>
                      <td className="px-3 py-2">{formatDateTime(c.scheduled_at)}</td>
                      <td className="px-3 py-2">{c.status}</td>
                      <td className="px-3 py-2">{c.bag_count}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{c.notes ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
