import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/70 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">GreenCredits</Link>
          <nav className="text-sm">
            <Link to="/login" className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Login</Link>
            <Link to="/signup" className="ml-2 px-3 py-1 rounded bg-emerald-600 text-white">Sign up</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-3xl mx-auto p-6">
          <Toaster position="top-right" toastOptions={{ style: { background: '#111827', color: 'white' } }} />
          <Outlet />
        </div>
      </main>
    </div>
  )
}




