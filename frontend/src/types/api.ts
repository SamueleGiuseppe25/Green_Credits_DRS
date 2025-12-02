export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface WalletBalanceResponse {
  balanceCents: number
  lastUpdated: string
}

export interface Transaction {
  id: number
  ts: string
  kind: string
  amountCents: number
  note?: string
}

export interface WalletHistoryResponse {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
}

export interface ClaimSubmitResponse {
  claimId: string
  status: 'Pending' | 'Approved' | 'Rejected'
  parsed?: {
    receiptId?: string
    retailer?: string
    amountCents?: number
    ts?: string
  }
}

export interface ReturnPoint {
  id: number
  name: string
  type: string
  eircode?: string
  retailer?: string
  lat: number
  lng: number
}

export interface ReturnPointsResponse {
  items: ReturnPoint[]
  total: number
}

// Phase 3: Subscriptions & Collections
export type SubscriptionStatus =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'inactive'
  | (string & {}) // allow forward-compatible statuses

export interface Subscription {
  status: SubscriptionStatus
  planCode: string | null
  startDate: string | null // ISO date
  endDate: string | null // ISO date or null
}

export interface CollectionSlot {
  weekday: number // 0-6 (backend returns a single preferred weekly slot)
  startTime: string // "HH:MM:SS" or "HH:MM"
  endTime: string
  preferredReturnPointId: number | null
  frequency: 'weekly' | 'fortnightly' | 'every_2_weeks' | 'monthly'
  enabled?: boolean
}

export interface Collection {
  id: number
  userId: number
  scheduledAt: string // ISO datetime
  returnPointId: number
  status: string
  bagCount?: number
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CollectionsResponse {
  items: Collection[]
  total: number
  page: number
  pageSize: number
}

export interface PendingClaimItem {
  claimId: string
  status: 'Pending'
  retailer?: string
  amountCents?: number
  ts?: string
}


