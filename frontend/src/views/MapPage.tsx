import React, { useMemo, useState } from 'react'
import { useReturnPoints } from '../hooks/useReturnPoints'
import { ReturnPoint } from '../types/api'
import { ReturnPointsMap } from '../components/ReturnPointsMap'

export const MapPage: React.FC = () => {
  const { data, isLoading, isError } = useReturnPoints()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const items = data?.items ?? []
  const selected: ReturnPoint | undefined = useMemo(
    () => items.find((i) => i.id === selectedId),
    [items, selectedId],
  )

  return (
    <section>
      <h1 className="text-2xl font-bold">Map</h1>
      <p className="text-sm opacity-70 mb-4">
        These are our partner return points. Collected bags are processed at these locations.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border rounded-md p-2 h-[540px]">
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center text-sm opacity-70">
              Loading return points…
            </div>
          )}
          {isError && (
            <div className="w-full h-full flex items-center justify-center text-sm text-red-600">
              Could not load return points.
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-sm opacity-70">
              No return points available.
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <ReturnPointsMap
              points={items}
              selectedPointId={selectedId}
              onSelectPoint={(id) => setSelectedId(id)}
            />
          )}
        </div>
        <div className="border rounded-md overflow-hidden">
            <div className="border-b px-3 py-2 font-semibold">Return Points</div>
            <ul className="max-h-[540px] overflow-auto">
              {items.map((rp) => {
                const isSel = rp.id === selectedId
                return (
                  <li
                    key={rp.id}
                    className={`px-3 py-2 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isSel ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                    }`}
                  onClick={() => setSelectedId(rp.id)}
                  >
                    <div className="font-medium">{rp.name}</div>
                    <div className="text-xs opacity-70">
                      {rp.type} {rp.retailer ? `• ${rp.retailer}` : ''} {rp.eircode ? `• ${rp.eircode}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="p-3 text-sm">
              {selected ? (
                <div className="space-y-1">
                  <div className="font-semibold">{selected.name}</div>
                  <div className="opacity-70">
                    {selected.type} {selected.retailer ? `• ${selected.retailer}` : ''}{' '}
                    {selected.eircode ? `• ${selected.eircode}` : ''}
                  </div>
                  <div className="opacity-70">
                    Lat/Lng: {selected.lat}, {selected.lng}
                  </div>
                </div>
              ) : (
                <div className="opacity-70">Select a return point to see details.</div>
              )}
            </div>
            <div className="border-t px-3 py-2">
              <div className="text-xs opacity-70 flex items-center gap-4">
                <span className="inline-flex items-center">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: '#22d3ee' }}
                  />
                  RVM
                </span>
                <span className="inline-flex items-center">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: '#fbbf24' }}
                  />
                  Manual
                </span>
                <span className="inline-flex items-center">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: '#60a5fa' }}
                  />
                  Other
                </span>
              </div>
            </div>
        </div>
      </div>
    </section>
  )
}


