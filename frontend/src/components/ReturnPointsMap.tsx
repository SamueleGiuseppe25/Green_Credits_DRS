import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { LatLngBoundsExpression } from 'leaflet'
import { ReturnPoint } from '../types/api'

// Ensure Leaflet default marker icons work with Vite builds
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default icon URLs don't resolve correctly in bundlers unless overridden.
// This fixes the common "broken marker icon" issue.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export interface ReturnPointsMapProps {
  points: ReturnPoint[]
  selectedPointId?: number | null
  onSelectPoint: (id: number) => void
}

const DEFAULT_CENTER: [number, number] = [53.3498, -6.2603] // Dublin
const DEFAULT_ZOOM = 12

function getPointColor(type?: string): string {
  const t = (type ?? '').trim().toUpperCase()
  switch (t) {
    case 'RVM':
      return '#22d3ee' // cyan/teal accent
    case 'MANUAL':
      return '#fbbf24' // amber accent
    default:
      return '#60a5fa' // blue fallback
  }
}

function FitBoundsOnPoints({ points }: { points: ReturnPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    if (points.length === 0) return
    let minLat = points[0].lat
    let maxLat = points[0].lat
    let minLng = points[0].lng
    let maxLng = points[0].lng
    for (const p of points) {
      if (p.lat < minLat) minLat = p.lat
      if (p.lat > maxLat) maxLat = p.lat
      if (p.lng < minLng) minLng = p.lng
      if (p.lng > maxLng) maxLng = p.lng
    }
    const paddedBounds: LatLngBoundsExpression = [
      [minLat, minLng],
      [maxLat, maxLng],
    ]
    map.fitBounds(paddedBounds, { padding: [20, 20] })
  }, [map, points])
  return null
}

function FlyToSelected({
  points,
  selectedId,
}: {
  points: ReturnPoint[]
  selectedId?: number | null
}) {
  const map = useMap()
  const target = useMemo(() => points.find((p) => p.id === selectedId), [points, selectedId])
  useEffect(() => {
    if (!map || !target) return
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.5 })
  }, [map, target])
  return null
}

export const ReturnPointsMap: React.FC<ReturnPointsMapProps> = ({
  points,
  selectedPointId = null,
  onSelectPoint,
}) => {
  const hasPoints = points.length > 0

  return (
    <div className="w-full h-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full rounded-md overflow-hidden"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPoints && <FitBoundsOnPoints points={points} />}
        {hasPoints && <FlyToSelected points={points} selectedId={selectedPointId} />}
        {points.map((rp) => {
          const isSelected = rp.id === selectedPointId
          return (
            <React.Fragment key={rp.id}>
              <Marker
                position={[rp.lat, rp.lng]}
                eventHandlers={{
                  click: () => onSelectPoint(rp.id),
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <div className="text-sm space-y-0.5">
                    <div className="font-semibold flex items-center">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getPointColor(rp.type) }}
                      />
                      {rp.name}
                    </div>
                    <div className="opacity-70">{rp.type}</div>
                    {rp.retailer && <div className="opacity-70">Retailer: {rp.retailer}</div>}
                    {rp.eircode && <div className="opacity-70">Eircode: {rp.eircode}</div>}
                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps?q=${rp.lat},${rp.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
              {isSelected && (
                <CircleMarker
                  center={[rp.lat, rp.lng]}
                  radius={14}
                  pathOptions={{
                    color: getPointColor(rp.type),
                    weight: 2,
                    opacity: 0.8,
                    fillColor: getPointColor(rp.type),
                    fillOpacity: 0.1,
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
      </MapContainer>
    </div>
  )
}


