import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RequireDriver: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="p-6 text-sm opacity-80">Loading...</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!user?.is_driver) {
    return <Navigate to="/wallet" replace />
  }
  return <>{children}</>
}
