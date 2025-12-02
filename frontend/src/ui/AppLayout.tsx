import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toaster } from 'react-hot-toast'
import { Wallet, Ticket, Map as MapIcon, Recycle, Settings as SettingsIcon, Shield, Menu, X } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('gc_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem('gc_sidebar_collapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[auto_1fr] grid-rows-[3.5rem_1fr]">
      <aside className={`hidden md:flex row-span-2 bg-white/80 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 backdrop-blur flex-col ${collapsed ? 'w-14' : 'w-64'} transition-[width] duration-200`}>
        <div className={`p-4 text-xl font-bold ${collapsed ? 'text-center' : ''}`}>
          <Link to="/" title="GreenCredits">{collapsed ? 'GC' : 'GreenCredits'}</Link>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem to="/wallet" label="Wallet" collapsed={collapsed} icon={<Wallet className="h-5 w-5" />} />
          <NavItem to="/claims" label="Claims" collapsed={collapsed} icon={<Ticket className="h-5 w-5" />} />
          <NavItem to="/map" label="Map" collapsed={collapsed} icon={<MapIcon className="h-5 w-5" />} />
          <NavItem to="/collections" label="Collections" collapsed={collapsed} icon={<Recycle className="h-5 w-5" />} />
          <NavItem to="/settings" label="Settings" collapsed={collapsed} icon={<SettingsIcon className="h-5 w-5" />} />
          {user?.is_admin ? <NavItem to="/admin" label="Admin" collapsed={collapsed} icon={<Shield className="h-5 w-5" />} /> : null}
          {!isAuthenticated && <NavItem to="/login" label="Login" collapsed={collapsed} />}
        </nav>
      </aside>
      <header className="md:col-start-2 bg-white/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 backdrop-blur flex items-center px-4">
        <button
          className="mr-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hidden md:inline-flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          className="mr-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden inline-flex"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
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
      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="text-lg font-semibold" onClick={() => setMobileOpen(false)}>GreenCredits</Link>
              <button
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              <NavItem to="/wallet" label="Wallet" icon={<Wallet className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} />
              <NavItem to="/claims" label="Claims" icon={<Ticket className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} />
              <NavItem to="/map" label="Map" icon={<MapIcon className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} />
              <NavItem to="/collections" label="Collections" icon={<Recycle className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} />
              <NavItem to="/settings" label="Settings" icon={<SettingsIcon className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} />
              {user?.is_admin ? <NavItem to="/admin" label="Admin" icon={<Shield className="h-5 w-5" />} onNavigate={() => setMobileOpen(false)} /> : null}
              {!isAuthenticated && <NavItem to="/login" label="Login" onNavigate={() => setMobileOpen(false)} />}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

const NavItem: React.FC<{ to: string; label: string; collapsed?: boolean; icon?: React.ReactNode; onNavigate?: () => void }> = ({ to, label, collapsed, icon, onNavigate }) => (
  <NavLink
    to={to}
    title={label}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''
      }`
    }
    onClick={onNavigate}
  >
    <span className="inline-flex h-6 w-6 items-center justify-center">
      {icon ?? <span className="rounded bg-gray-200 dark:bg-gray-700 text-xs h-6 w-6 inline-flex items-center justify-center">{label[0]}</span>}
    </span>
    {!collapsed && <span>{label}</span>}
  </NavLink>
)


