import React from 'react'
import { useQuery } from '@tanstack/react-query'

export const AdminPage: React.FC = () => {
  // Mock a pending claims list via MSW in future; for now, reuse /claims/submit shape
  const { data } = useQuery({
    queryKey: ['admin','pending'],
    queryFn: async () => {
      return [{ claimId: 'clm_01H', status: 'Pending', retailer: 'SuperValu', amountCents: 105, ts: new Date().toISOString() }]
    },
  })
  return (
    <section>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-sm opacity-70 mb-4">
        Admin view for reviewing claims and payments. In a full system this area is restricted to staff.
      </p>
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
          {data?.map((c) => (
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


