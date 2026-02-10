import { apiFetch } from './api'

export async function createCheckoutSession(
  planCode: 'weekly' | 'monthly' | 'yearly'
): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/payments/checkout-session', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
  })
}

