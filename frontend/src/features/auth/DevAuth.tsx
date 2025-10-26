import React, { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'token'

export const DevAuth: React.FC = () => {
  const [value, setValue] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })

  const apply = useCallback((token: string) => {
    try {
      if (token) localStorage.setItem(STORAGE_KEY, token)
      else localStorage.removeItem(STORAGE_KEY)
      // Write fallback key for legacy readers
      if (token) localStorage.setItem('gc.token', token)
      else localStorage.removeItem('gc.token')
    } catch {}
    setValue(token)
    if (typeof window !== 'undefined') {
      // Ensure components see the change immediately
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    const onStorage = () => {
      try { setValue(localStorage.getItem(STORAGE_KEY) || '') } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <div className="flex items-center gap-1">
      <label className="text-xs opacity-70">Dev Auth:</label>
      <select
        className="text-xs bg-white/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5"
        value={value}
        onChange={(e) => apply(e.target.value)}
        title="Set Authorization header for dev"
      >
        <option value="">(none)</option>
        <option value="Bearer user">Bearer user</option>
        <option value="Bearer admin">Bearer admin</option>
      </select>
    </div>
  )
}


