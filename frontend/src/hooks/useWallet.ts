import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { WalletBalanceResponse, WalletHistoryResponse } from '../types/api'

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


