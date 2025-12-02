import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

export const AdminPage: React.FC = () => {
  const ping = useQuery({
    queryKey: ['admin','ping'],
    queryFn: () => apiFetch<{ status: string }>('/admin/ping'),
    staleTime: 10_000,
  })
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
      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="p-2">Claim ID</th>
            <th className="p-2">Status</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Retailer</th>
          </tr>
        </thead>
        <tbody>
          {[{ claimId: 'clm_01H', status: 'Pending', retailer: 'SuperValu', amountCents: 105, ts: new Date().toISOString() }].map((c) => (
            <tr key={c.claimId} className="border-t">
              <td className="p-2">{c.claimId}</td>
              <td className="p-2">{c.status}</td>
              <td className="p-2">€{((c.amountCents || 0)/100).toFixed(2)}</td>
              <td className="p-2">{c.retailer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}


