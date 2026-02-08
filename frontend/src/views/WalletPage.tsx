import React, { useState } from 'react'
import {
  useWalletBalance,
  useWalletHistory,
  useDonateVoucher,
  useRedeemVoucher,
} from '../hooks/useWallet'

export const WalletPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [successProof, setSuccessProof] = useState<string | null>(null)

  const balance = useWalletBalance()
  const history = useWalletHistory(page, pageSize)
  const donate = useDonateVoucher()
  const redeem = useRedeemVoucher()

  const formatEuro = (cents: number) => (cents / 100).toFixed(2)
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

  const total = history.data?.total || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < pageCount

  const handleDonate = () => {
    const raw = window.prompt('Amount to donate (euros)', '0')
    if (raw == null) return
    const euros = parseFloat(raw)
    if (Number.isNaN(euros) || euros <= 0) {
      window.alert('Please enter a positive amount in euros.')
      return
    }
    setSuccessProof(null)
    donate.mutate(Math.round(euros * 100), {
      onSuccess: (data) => setSuccessProof(data.proofRef),
      onError: (err) => window.alert(err instanceof Error ? err.message : 'Donate failed'),
    })
  }

  const handleRedeem = () => {
    const raw = window.prompt('Amount to redeem (euros)', '0')
    if (raw == null) return
    const euros = parseFloat(raw)
    if (Number.isNaN(euros) || euros <= 0) {
      window.alert('Please enter a positive amount in euros.')
      return
    }
    setSuccessProof(null)
    redeem.mutate(Math.round(euros * 100), {
      onSuccess: (data) => setSuccessProof(data.proofRef),
      onError: (err) => window.alert(err instanceof Error ? err.message : 'Redeem failed'),
    })
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Voucher Balance</h1>
      <p className="text-sm opacity-70 mb-4">
        Your GreenCredits voucher balance from collected bottles and cans. Each completed collection adds credit here.
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
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded border bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  onClick={handleDonate}
                  disabled={donate.isPending || (balance.data?.balanceCents ?? 0) <= 0}
                >
                  Donate
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded border bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  onClick={handleRedeem}
                  disabled={redeem.isPending || (balance.data?.balanceCents ?? 0) <= 0}
                >
                  Redeem
                </button>
              </div>
              {successProof && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Proof reference: {successProof}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Recent transactions</h2>
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
                    <th className="text-left px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.items.map((txn) => {
                    const positive = txn.amountCents >= 0
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


