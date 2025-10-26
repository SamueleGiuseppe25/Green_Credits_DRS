import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { components } from '../../types/api.d'

export type Subscription = components['schemas']['Subscription']
export type CollectionSlot = components['schemas']['CollectionSlot']

export const subscriptionKeys = {
  root: ['subscription'] as const,
  me: () => [...subscriptionKeys.root, 'me'] as const,
}

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.me(),
    queryFn: () => api<Subscription>('/subscriptions/me'),
  })
}

export function useActivateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<Subscription>('/subscriptions/activate', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.me() })
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<Subscription>('/subscriptions/cancel', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.me() })
    },
  })
}

export function useMyCollectionSlot() {
  return useQuery({
    queryKey: ['collection-slot', 'me'],
    queryFn: () => api<CollectionSlot>('/collection-slots/me'),
  })
}


