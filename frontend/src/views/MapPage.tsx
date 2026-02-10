import React from 'react'
import { useReturnPoints } from '../hooks/useReturnPoints'
import { ReturnPoint } from '../types/api'

export const MapPage: React.FC = () => {
  const { data, isLoading, isError } = useReturnPoints({ pageSize: 500 })
  const items = data?.items ?? []

  return (
    <section>
      <h1 className="text-2xl font-bold">Return Points</h1>
      <p className="text-sm opacity-70 mb-4">
        Open a partner location in Google Maps to navigate.
      </p>
      {isLoading && <div className="text-sm opacity-70">Loading return points…</div>}
      {isError && <div className="text-sm text-red-600">Could not load return points.</div>}
      {!isLoading && !isError && items.length === 0 && <div className="text-sm opacity-70">No return points.</div>}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="divide-y border rounded-md overflow-hidden">
          {items.map((rp: ReturnPoint) => {
            const url = `https://www.google.com/maps/search/?api=1&query=${rp.lat},${rp.lng}`
            return (
              <li key={rp.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{rp.name}</div>
                  <div className="text-xs opacity-70">{rp.type} {rp.retailer ? `• ${rp.retailer}` : ''} {rp.eircode ? `• ${rp.eircode}` : ''}</div>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Open in Google Maps
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
