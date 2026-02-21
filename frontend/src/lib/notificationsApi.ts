import { apiFetch } from './api'
import type { Notification } from '../types/api'

export function fetchMyNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/notifications/me')
}

export function markNotificationRead(id: number): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' })
}
