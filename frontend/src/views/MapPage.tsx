import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ReturnPointsResponse } from '../types/api'

export const MapPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['return-points'],
    queryFn: () => api<ReturnPointsResponse>('/return-points'),
  })
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Map</h1>
      {isLoading ? 'Loading...' : (
        <ul className="list-disc ml-6">
          {data?.items?.map(rp => (
            <li key={rp.id}>{rp.name} ({rp.type})</li>
          ))}
        </ul>
      )}
    </section>
  )
}


