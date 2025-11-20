import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toaster } from 'react-hot-toast'

export const AppLayout: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr] grid-rows-[3.5rem_1fr]">
      <aside className="hidden md:block row-span-2 bg-white/80 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 backdrop-blur">
        <div className="p-4 text-xl font-bold">
          <Link to="/">GreenCredits</Link>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem to="/wallet" label="Wallet" />
          <NavItem to="/claims" label="Claims" />
          <NavItem to="/map" label="Map" />
          <NavItem to="/subscriptions" label="Subscriptions" />
          <NavItem to="/collections" label="Collections" />
          <NavItem to="/admin" label="Admin" />
          {!isAuthenticated && <NavItem to="/login" label="Login" />}
        </nav>
      </aside>
      <header className="md:col-start-2 bg-white/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 backdrop-blur flex items-center px-4">
        <h1 className="text-lg font-semibold">GreenCredits</h1>
        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated && user && (
            <span className="text-sm opacity-70">{user.email}</span>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          )}
          <div className="text-sm opacity-70">MVP</div>
        </div>
      </header>
      <main className="md:col-start-2 p-6">
        <Toaster position="top-right" toastOptions={{ style: { background: '#111827', color: 'white' } }} />
        <Outlet />
      </main>
    </div>
  )
}

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''
      }`
    }
  >
    {label}
  </NavLink>
)


