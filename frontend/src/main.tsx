import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes'
import './index.css'
import { AuthProvider } from './context/AuthContext'

// Only use MSW (Mock Service Worker) for fake auth when explicitly enabled
// Default: use real backend auth (MSW disabled)
// To enable fake auth: set VITE_USE_DEV_AUTH=true in .env
const USE_DEV_AUTH = import.meta.env.VITE_USE_DEV_AUTH === 'true'

if (import.meta.env.DEV && USE_DEV_AUTH) {
  // Dynamically import MSW only when needed
  import('./mocks/browser').then(({ worker }) => {
    worker.start({ onUnhandledRequest: 'bypass' })
  })
}

const router = createBrowserRouter(routes)
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)



