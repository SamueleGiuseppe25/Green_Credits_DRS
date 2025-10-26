import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const token =
    (typeof window !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('gc.token'))) || null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}



