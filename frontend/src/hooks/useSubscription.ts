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

export function usePauseCollectionSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: number) =>
      apiFetch<CollectionSlot>(`/collection-slots/${slotId}/pause`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-slots', 'me'] })
      toast.success('Schedule paused')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not pause schedule')
    },
  })
}

export function useResumeCollectionSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: number) =>
      apiFetch<CollectionSlot>(`/collection-slots/${slotId}/resume`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-slots', 'me'] })
      toast.success('Schedule resumed')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not resume schedule')
    },
  })
}

export function useCancelCollectionSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: number) =>
      apiFetch<void>(`/collection-slots/${slotId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-slots', 'me'] })
      toast.success('Schedule cancelled')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not cancel schedule')
    },
  })
}
