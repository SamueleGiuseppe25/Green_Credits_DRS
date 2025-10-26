import React from 'react'
import { Link } from 'react-router-dom'
import { useMyCollectionSlot, useSubscription } from '../api'

function formatMoneyCents(cents?: number | null): string | null {
  if (cents == null) return null
  return `€${(cents / 100).toFixed(2)}`
}

export const MySubscriptionPage: React.FC = () => {
  const sub = useSubscription()
  const slot = useMyCollectionSlot()

  if (sub.isLoading || slot.isLoading) {
    return <div>Loading…</div>
  }
  if (sub.isError) {
    return <div className="text-red-600">Failed to load subscription. <button className="underline" onClick={() => sub.refetch()}>Retry</button></div>
  }

  const data = sub.data
  const nextWindow = slot.data

  const status = (data?.status || 'unknown').toLowerCase()
  const planName = data?.planCode || 'N/A'
  // TODO: sync with OpenAPI types if price becomes available via API
  const planPrice = null as number | null

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">My Subscription</h1>
      <div className="rounded border border-gray-200 dark:border-gray-700 p-4 bg-white/70 dark:bg-gray-800/60">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium">Status</div>
            <div className="capitalize">{status}</div>
          </div>
          <div>
            <div className="font-medium">Plan</div>
            <div>{planName}{planPrice != null ? ` · ${formatMoneyCents(planPrice)}/mo` : ''}</div>
          </div>
          <div className="col-span-2">
            <div className="font-medium">Next collection window</div>
            {nextWindow ? (
              <div>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][nextWindow.weekday]} {nextWindow.startTime}–{nextWindow.endTime}</div>
            ) : (
              <div className="opacity-70">Not set</div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Link to="/subscription/manage" className="inline-flex items-center rounded bg-gray-900 text-white text-sm px-3 py-1.5 hover:opacity-90">Change/Cancel</Link>
        </div>
      </div>
    </section>
  )
}


