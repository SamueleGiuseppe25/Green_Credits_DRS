import React from 'react'
import { SubscriptionBadge } from '../features/subscriptions/components/SubscriptionBadge'
import { DevAuth } from '../features/auth/DevAuth'

export const Header: React.FC = () => {
  return (
    <header className="col-start-2 bg-white/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 backdrop-blur flex items-center px-4">
      <h1 className="text-lg font-semibold">GreenCredits</h1>
      <SubscriptionBadge />
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span className="opacity-70">MVP</span>
        <DevAuth />
      </div>
    </header>
  )
}


