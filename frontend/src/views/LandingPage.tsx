import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/wallet', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  return (
    <section className="text-center">
      <h1 className="text-3xl font-bold mb-4">GreenCredits</h1>
      <p className="mb-6 opacity-80">Deposit Return Scheme credits for bottles and cans.</p>
      <div className="grid gap-3 text-left max-w-xl mx-auto mb-8">
        <div className="p-3 border rounded-md">
          <div className="font-semibold">1. Collect and schedule pickup</div>
          <div className="text-sm opacity-70">Use Subscriptions or Collections to arrange bag pickups.</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="font-semibold">2. Processing at return points</div>
          <div className="text-sm opacity-70">Bags are processed at partner locations.</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="font-semibold">3. Earn GreenCredits</div>
          <div className="text-sm opacity-70">Credits appear in your wallet after processing.</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="font-semibold">4. Redeem and track</div>
          <div className="text-sm opacity-70">Use your balance and see recent transactions.</div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link to="/signup" className="px-4 py-2 rounded bg-emerald-600 text-white">Sign up</Link>
        <Link to="/login" className="px-4 py-2 rounded border">Login</Link>
      </div>
    </section>
  )
}




