import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { Collection, CollectionsResponse } from '../types/api'
import toast from 'react-hot-toast'

export function useCollections(params: { page?: number; pageSize?: number; status?: string | null } = {}) {
  const { page = 1, pageSize = 20, status = null } = params
  const search = new URLSearchParams()
  if (status) search.set('status', status)
  if (page) search.set('page', String(page))
  if (pageSize) search.set('pageSize', String(pageSize))
  const qs = search.toString()
  const path = `/collections/me${qs ? `?${qs}` : ''}`

  return useQuery({
    queryKey: ['collections', { page, pageSize, status }],
    queryFn: () => apiFetch<CollectionsResponse>(path),
    staleTime: 30_000,
  })
}

export interface CreateCollectionPayload {
  scheduledAt: string
  returnPointId: number
  bagCount?: number
  notes?: string | null
  voucherPreference?: 'wallet' | 'donate'
  charityId?: string
  collectionType?: 'bottles' | 'glass' | 'both'
}

export function useCreateCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) =>
      apiFetch<Collection>('/collections', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection scheduled')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not create collection${detail}`)
    },
  })
}

export function useCancelCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Collection>(`/collections/${id}/cancel`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection cancelled')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not cancel collection${detail}`)
    },
  })
}

export function useDeleteCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/collections/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection removed')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not remove collection${detail}`)
    },
  })
}



