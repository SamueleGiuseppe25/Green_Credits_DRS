import { RouteObject } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { PublicLayout } from './ui/PublicLayout'
import { LoginPage } from './views/LoginPage'
import { WalletPage } from './views/WalletPage'
import { ClaimsPage } from './views/ClaimsPage'
import { MapPage } from './views/MapPage'
import { AdminPage } from './views/AdminPage'
import { RouteGuard } from './ui/RouteGuard'
import { RequireAdmin } from './ui/RequireAdmin'
import { CollectionsPage } from './views/CollectionsPage'
import { LandingPage } from './views/LandingPage'
import { SignupPage } from './views/SignupPage'
import { SettingsPage } from './views/SettingsPage'
import { SubscribeSuccessPage } from './views/SubscribeSuccessPage'
import { SubscribeCancelPage } from './views/SubscribeCancelPage'

export const routes: RouteObject[] = [
  // Public routes (no sidebar)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/subscribe/success', element: <SubscribeSuccessPage /> },
      { path: '/subscribe/cancel', element: <SubscribeCancelPage /> },
    ],
  },
  // Private routes (with sidebar)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/wallet', element: <RouteGuard><WalletPage /></RouteGuard> },
      { path: '/claims', element: <RouteGuard><ClaimsPage /></RouteGuard> },
      { path: '/map', element: <RouteGuard><MapPage /></RouteGuard> },
      { path: '/collections', element: <RouteGuard><CollectionsPage /></RouteGuard> },
      { path: '/settings', element: <RouteGuard><SettingsPage /></RouteGuard> },
      { path: '/admin', element: <RouteGuard><RequireAdmin><AdminPage /></RequireAdmin></RouteGuard> },
    ],
  },
]


