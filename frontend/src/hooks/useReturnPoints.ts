import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { ReturnPointsResponse } from '../types/api'

export interface ReturnPointsQuery {
  chain?: string | null
  q?: string | null
  near?: string | null // "lat,lng"
  page?: number
  pageSize?: number
}

export function useReturnPoints(params: ReturnPointsQuery = {}) {
  const { chain = null, q = null, near = null, page = 1, pageSize = 100 } = params
  const search = new URLSearchParams()
  if (chain) search.set('chain', chain)
  if (q) search.set('q', q)
  if (near) search.set('near', near)
  if (page) search.set('page', String(page))
  if (pageSize) search.set('pageSize', String(pageSize))

  const qs = search.toString()
  const path = `/return-points${qs ? `?${qs}` : ''}`

  return useQuery({
    queryKey: ['return-points', { chain, q, near, page, pageSize }],
    queryFn: () => apiFetch<ReturnPointsResponse>(path),
    staleTime: 60_000,
  })
}


