import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { WalletBalanceResponse, WalletHistoryResponse } from '../types/api'

export const WalletPage: React.FC = () => {
  const balance = useQuery({
    queryKey: ['wallet','balance'],
    queryFn: () => api<WalletBalanceResponse>('/wallet/balance'),
  })
  const history = useQuery({
    queryKey: ['wallet','history'],
    queryFn: () => api<WalletHistoryResponse>('/wallet/history?page=1&pageSize=5'),
  })

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Balance</h2>
          {balance.isLoading ? 'Loading...' : (
            <div>€{((balance.data?.balanceCents || 0) / 100).toFixed(2)}</div>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Recent</h2>
          <ul className="list-disc ml-6">
            {history.data?.items?.map(txn => (
              <li key={txn.id}>{txn.kind} {txn.amountCents}c at {new Date(txn.ts).toLocaleString()}</li>
            )) || null}
          </ul>
        </div>
      </div>
    </section>
  )
}


