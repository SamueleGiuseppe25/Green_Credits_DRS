import React from 'react'
import { RouteObject } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { LoginPage } from './views/LoginPage'
import { WalletPage } from './views/WalletPage'
import { ClaimsPage } from './views/ClaimsPage'
import { MapPage } from './views/MapPage'
import { AdminPage } from './views/AdminPage'
import { RouteGuard } from './ui/RouteGuard'
import { SubscriptionsPage } from './views/SubscriptionsPage'
import { CollectionsPage } from './views/CollectionsPage'

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
      { path: '/subscriptions', element: <RouteGuard><SubscriptionsPage /></RouteGuard> },
      { path: '/collections', element: <RouteGuard><CollectionsPage /></RouteGuard> },
      { path: '/admin', element: <RouteGuard><AdminPage /></RouteGuard> },
    ],
  },
]


