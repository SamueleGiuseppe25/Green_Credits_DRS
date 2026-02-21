import { apiFetch } from './api'
import type { Claim } from '../types/api'

export function submitClaim(description: string, imageUrl?: string): Promise<Claim> {
  return apiFetch<Claim>('/claims', {
    method: 'POST',
    body: JSON.stringify({ description, imageUrl: imageUrl || null }),
  })
}

export function fetchMyClaims(): Promise<Claim[]> {
  return apiFetch<Claim[]>('/claims/me')
}
