import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Header } from '../components/Header'

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-cols-[16rem_1fr] grid-rows-[3.5rem_1fr]">
      <aside className="row-span-2 bg-white/80 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 backdrop-blur">
        <div className="p-4 text-xl font-bold">
          <Link to="/">GreenCredits</Link>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem to="/wallet" label="Wallet" />
          <NavItem to="/claims" label="Claims" />
          <NavItem to="/map" label="Map" />
          <NavItem to="/admin" label="Admin" />
          <NavItem to="/subscription" label="Subscription" />
          <NavItem to="/login" label="Login" />
        </nav>
      </aside>
      <Header />
      <main className="col-start-2 p-6">
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


