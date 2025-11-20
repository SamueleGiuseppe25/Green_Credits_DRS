import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { Subscription, CollectionSlot } from '../types/api'
import toast from 'react-hot-toast'

export function useMySubscription() {
  return useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: () => apiFetch<Subscription>('/subscriptions/me'),
    staleTime: 60_000,
  })
}

export function useMyCollectionSlots() {
  return useQuery({
    queryKey: ['collection-slots', 'me'],
    queryFn: () => apiFetch<CollectionSlot>('/collection-slots/me'),
    staleTime: 60_000,
  })
}

export function useUpsertCollectionSlots() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CollectionSlot) =>
      apiFetch<CollectionSlot>('/collection-slots/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-slots', 'me'] })
      toast.success('Schedule updated')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not update schedule${detail}`)
    },
  })
}


