import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toaster } from 'react-hot-toast'
import { Wallet, Ticket, Map as MapIcon, Recycle, Settings as SettingsIcon, Shield, Truck, Menu, X, Bell } from 'lucide-react'
import { fetchMyNotifications, markNotificationRead } from '../lib/notificationsApi'
import type { Notification } from '../types/api'

type SidebarNavItem = {
  to: string
  label: string
  icon?: React.ReactNode
}

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
      try { localStorage.setItem('gc_sidebar_collapsed', next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }

  const isAdmin = Boolean(user?.is_admin)
  const isDriver = Boolean(user?.is_driver) && !isAdmin // admin takes priority

  const navItems: SidebarNavItem[] = React.useMemo(() => {
    if (!isAuthenticated) {
      return [{ to: '/login', label: 'Login' }]
    }
    if (isAdmin) {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: <Shield className="h-5 w-5" /> },
        { to: '/map', label: 'Map', icon: <MapIcon className="h-5 w-5" /> },
      ]
    }
    if (isDriver) {
      return [
        { to: '/driver', label: 'Driver Dashboard', icon: <Truck className="h-5 w-5" /> },
        { to: '/map', label: 'Map', icon: <MapIcon className="h-5 w-5" /> },
      ]
    }
    return [
      { to: '/wallet', label: 'Wallet', icon: <Wallet className="h-5 w-5" /> },
      { to: '/collections', label: 'Collections', icon: <Recycle className="h-5 w-5" /> },
      { to: '/claims', label: 'Claims', icon: <Ticket className="h-5 w-5" /> },
      { to: '/map', label: 'Map', icon: <MapIcon className="h-5 w-5" /> },
      { to: '/settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5" /> },
    ]
  }, [isAdmin, isAuthenticated, isDriver])

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[auto_1fr] grid-rows-[3.5rem_1fr]">
      <aside className={`hidden md:flex row-span-2 bg-white/80 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 backdrop-blur flex-col ${collapsed ? 'w-14' : 'w-64'} transition-[width] duration-200`}>
        <div className={`p-4 text-xl font-bold ${collapsed ? 'text-center' : ''}`}>
          <Link to="/" title="GreenCredits">{collapsed ? 'GC' : 'GreenCredits'}</Link>
        </div>
        <nav className="px-2 space-y-1">
          {navItems.map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} collapsed={collapsed} icon={it.icon} />
          ))}
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
          {isAuthenticated && !isAdmin && !isDriver && (
            <NotificationBell />
          )}
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
              {navItems.map((it) => (
                <NavItem key={it.to} to={it.to} label={it.label} icon={it.icon} onNavigate={() => setMobileOpen(false)} />
              ))}
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

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetchMyNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false))
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const unreadCount = notifications.filter((n) => !n.isRead && n.userId !== null).length

  const handleMarkRead = async (n: Notification) => {
    if (n.isRead || n.userId === null) return
    try {
      const updated = await markNotificationRead(n.id)
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? updated : x))
      )
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
          {loading ? (
            <div className="p-3 text-sm opacity-70">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-3 text-sm opacity-70">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMarkRead(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleMarkRead(n)
                  }}
                  className="p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && n.userId !== null && (
                      <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-green-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs opacity-80 line-clamp-2 mt-0.5">{n.body}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


