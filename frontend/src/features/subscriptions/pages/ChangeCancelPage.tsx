import React, { useEffect, useState } from 'react'
import { useActivateSubscription, useCancelSubscription, useSubscription } from '../api'

export const ChangeCancelPage: React.FC = () => {
  const sub = useSubscription()
  const activate = useActivateSubscription()
  const cancel = useCancelSubscription()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activate.isSuccess) setMessage('Subscription activated')
    if (cancel.isSuccess) setMessage('Subscription cancelled')
  }, [activate.isSuccess, cancel.isSuccess])

  useEffect(() => {
    if (activate.isError) setError((activate.error as Error)?.message || 'Activation failed')
    if (cancel.isError) setError((cancel.error as Error)?.message || 'Cancellation failed')
  }, [activate.isError, activate.error, cancel.isError, cancel.error])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Subscription</h1>
      {sub.data ? (
        <div className="text-sm opacity-80">Current status: <span className="capitalize">{sub.data.status}</span></div>
      ) : null}
      {message && (
        <div className="rounded border border-green-300 bg-green-50 text-green-800 px-3 py-2 text-sm">{message}</div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</div>
      )}
      <div className="flex gap-3">
        <button
          className="inline-flex items-center rounded bg-green-600 text-white text-sm px-3 py-1.5 disabled:opacity-60"
          onClick={() => { setMessage(null); setError(null); activate.mutate() }}
          disabled={activate.isPending}
        >
          {activate.isPending ? 'Activating…' : 'Activate'}
        </button>
        <button
          className="inline-flex items-center rounded bg-gray-700 text-white text-sm px-3 py-1.5 disabled:opacity-60"
          onClick={() => { setMessage(null); setError(null); cancel.mutate() }}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Cancelling…' : 'Cancel'}
        </button>
      </div>
    </section>
  )
}


