import React from 'react'
import { RouteObject } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { LoginPage } from './views/LoginPage'
import { WalletPage } from './views/WalletPage'
import { ClaimsPage } from './views/ClaimsPage'
import { MapPage } from './views/MapPage'
import { AdminPage } from './views/AdminPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <WalletPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/wallet', element: <WalletPage /> },
      { path: '/claims', element: <ClaimsPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/admin', element: <AdminPage /> },
    ],
  },
]


