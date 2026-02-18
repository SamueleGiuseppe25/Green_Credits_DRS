import React from 'react'
import { Link } from 'react-router-dom'

export const SubscribeCancelPage: React.FC = () => {
  return (
    <section className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Checkout cancelled</h1>
      <p className="text-sm opacity-70 mb-4">
        No worries — you were not charged. You can try again any time.
      </p>
      <div className="flex gap-2">
        <Link className="text-sm px-3 py-1 rounded bg-emerald-600 text-white" to="/settings">Back to settings</Link>
        <Link className="text-sm px-3 py-1 rounded border" to="/wallet">Go to wallet</Link>
      </div>
    </section>
  )
}

