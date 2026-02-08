import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import {
  WalletBalanceResponse,
  WalletHistoryResponse,
  DonateRedeemResponse,
} from '../types/api'

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => apiFetch<WalletBalanceResponse>('/wallet/balance'),
    staleTime: 60_000,
  })
}

export function useWalletHistory(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['wallet', 'history', { page, pageSize }],
    queryFn: () => apiFetch<WalletHistoryResponse>(`/wallet/history?page=${page}&pageSize=${pageSize}`),
  })
}

export function useDonateVoucher() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (amountCents: number) =>
      apiFetch<DonateRedeemResponse>('/wallet/donate', {
        method: 'POST',
        body: JSON.stringify({ amountCents }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      client.invalidateQueries({ queryKey: ['wallet', 'history'] })
    },
  })
}

export function useRedeemVoucher() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (amountCents: number) =>
      apiFetch<DonateRedeemResponse>('/wallet/redeem', {
        method: 'POST',
        body: JSON.stringify({ amountCents }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      client.invalidateQueries({ queryKey: ['wallet', 'history'] })
    },
  })
}


