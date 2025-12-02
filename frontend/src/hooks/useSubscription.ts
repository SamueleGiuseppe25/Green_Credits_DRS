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

export function useDeleteCollectionSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<void>('/collection-slots/me', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-slots', 'me'] })
      toast.success('Recurring pickup schedule disabled')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not disable schedule${detail}`)
    },
  })
}

export function useChoosePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planCode: 'weekly' | 'monthly' | 'yearly') =>
      apiFetch<Subscription>('/subscriptions/choose', {
        method: 'POST',
        body: JSON.stringify({ planCode }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', 'me'] })
      toast.success('Subscription activated')
    },
    onError: (err: any) => {
      const detail = err?.message ? `: ${err.message}` : ''
      toast.error(`Could not activate subscription${detail}`)
    },
  })
}


