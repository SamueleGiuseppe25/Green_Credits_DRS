import React, { useState } from 'react'
import { useWalletBalance, useWalletHistory } from '../hooks/useWallet'
import { API_BASE_URL } from '../lib/api'

export const WalletPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const balance = useWalletBalance()
  const history = useWalletHistory(page, pageSize)

  const formatEuro = (cents: number) => (cents / 100).toFixed(2)
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

  const total = history.data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < pageCount

  return (
    <section>
      <h1 className="text-2xl font-bold">Wallet</h1>
      <p className="text-sm opacity-70 mb-4">
        Your GreenCredits balance from collected bottles and cans. Each completed collection adds credit here.
      </p>
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Balance</h2>
          {balance.isLoading && <div className="text-sm opacity-70">Loading balance…</div>}
          {balance.isError && (
            <div className="text-sm text-red-600">Could not load balance. Please try again.</div>
          )}
          {balance.data && (
            <div className="mt-1">
              <div className="text-3xl font-semibold">€{formatEuro(balance.data.balanceCents)}</div>
              <div className="text-xs opacity-60">
                Last updated: {formatDateTime(balance.data.lastUpdated)}
              </div>
            </div>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Recent</h2>
          {history.isLoading && <div className="text-sm opacity-70">Loading transactions…</div>}
          {history.isError && (
            <div className="text-sm text-red-600">Could not load transactions. Please try again.</div>
          )}
          {history.data && history.data.items.length === 0 && (
            <div className="text-sm opacity-70">No transactions yet.</div>
          )}
          {history.data && history.data.items.length > 0 && (
            <div className="mt-2 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Collection</th>
                    <th className="text-left px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.items.map((txn) => {
                    const positive = txn.amountCents >= 0
                    const isCollectionRelated =
                      (txn.kind === 'collection_credit' || txn.kind === 'collection_completed') &&
                      (txn.collectionId != null || txn.collectionStatus != null)
                    return (
                      <tr key={txn.id} className="border-t">
                        <td className="px-3 py-2">{formatDateTime(txn.ts)}</td>
                        <td className="px-3 py-2">{txn.kind}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={positive ? 'text-green-600' : 'text-red-600'}>
                            {positive ? '+' : '-'}
                            €{formatEuro(Math.abs(txn.amountCents))}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {isCollectionRelated ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {txn.collectionId != null && (
                                <span className="text-xs opacity-80">#{txn.collectionId}</span>
                              )}
                              {txn.collectionStatus && (
                                <CollectionStatusBadge status={txn.collectionStatus} />
                              )}
                              {txn.proofUrl && (
                                <a
                                  href={
                                    txn.proofUrl.startsWith('/')
                                      ? `${API_BASE_URL}${txn.proofUrl}`
                                      : txn.proofUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block"
                                  title="View proof"
                                >
                                  <img
                                    src={
                                      txn.proofUrl.startsWith('/')
                                        ? `${API_BASE_URL}${txn.proofUrl}`
                                        : txn.proofUrl
                                    }
                                    alt="Proof"
                                    className="w-8 h-8 object-cover rounded border"
                                  />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs opacity-50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{txn.note || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border disabled:opacity-50"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="px-2 py-1 rounded border disabled:opacity-50"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
                <div className="opacity-70">
                  Page {page} / {pageCount} • Total {total}
                </div>
                <div className="flex items-center gap-2">
                  <label className="opacity-70">Page size</label>
                  <select
                    className="border rounded px-2 py-1 bg-transparent"
                    value={pageSize}
                    onChange={(e) => {
                      setPage(1)
                      setPageSize(parseInt(e.target.value, 10))
                    }}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const CollectionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    collected: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  )
}
