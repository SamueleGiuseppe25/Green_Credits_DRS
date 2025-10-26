import React from 'react'
import { RouteObject } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { LoginPage } from './views/LoginPage'
import { WalletPage } from './views/WalletPage'
import { ClaimsPage } from './views/ClaimsPage'
import { MapPage } from './views/MapPage'
import { AdminPage } from './views/AdminPage'
import { RouteGuard } from './ui/RouteGuard'
import { MySubscriptionPage } from './features/subscriptions/pages/MySubscriptionPage'
import { ChangeCancelPage } from './features/subscriptions/pages/ChangeCancelPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <RouteGuard><WalletPage /></RouteGuard> },
      { path: '/login', element: <LoginPage /> },
      { path: '/wallet', element: <RouteGuard><WalletPage /></RouteGuard> },
      { path: '/claims', element: <RouteGuard><ClaimsPage /></RouteGuard> },
      { path: '/map', element: <RouteGuard><MapPage /></RouteGuard> },
      { path: '/admin', element: <RouteGuard><AdminPage /></RouteGuard> },
      { path: '/subscription', element: <RouteGuard><MySubscriptionPage /></RouteGuard> },
      { path: '/subscription/manage', element: <RouteGuard><ChangeCancelPage /></RouteGuard> },
    ],
  },
]


