import React from 'react'
import { useSubscription } from '../api'

export const SubscriptionBadge: React.FC = () => {
  const { data, isLoading, isError } = useSubscription()

  if (isLoading) {
    return (
      <span className="ml-3 inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs">Loading…</span>
    )
  }
  if (isError || !data) {
    return (
      <span className="ml-3 inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs">Unknown</span>
    )
  }

  const active = (data.status || '').toLowerCase() === 'active'
  const classes = active
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-200 text-gray-700'
  const label = active ? 'Active' : 'Cancelled'

  return (
    <span className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${classes}`}>{label}</span>
  )
}


