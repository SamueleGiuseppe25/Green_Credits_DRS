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
  collectionId?: number
  collectionStatus?: string
  proofUrl?: string
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
  currentPeriodStart?: string | null // ISO date
  currentPeriodEnd?: string | null // ISO date
}

export interface CollectionSlot {
  id?: number
  weekday: number // 0-6 (backend returns a single preferred weekly slot)
  startTime: string // "HH:MM:SS" or "HH:MM"
  endTime: string
  preferredReturnPointId: number | null
  frequency: 'weekly' | 'fortnightly' | 'every_2_weeks' | 'monthly'
  status?: 'active' | 'paused' | 'cancelled'
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
  driverId?: number | null
  proofUrl?: string | null
  voucherAmountCents?: number | null
  createdAt: string
  updatedAt: string
}

export interface CollectionsResponse {
  items: Collection[]
  total: number
  page: number
  pageSize: number
}

export interface DriverProfile {
  id: number
  userId: number
  vehicleType: string | null
  vehiclePlate: string | null
  phone: string | null
  isAvailable: boolean
}

export interface DriverCollection {
  id: number
  userId: number
  scheduledAt: string
  returnPointId: number
  status: string
  bagCount: number
  notes: string | null
  driverId: number | null
  proofUrl: string | null
  voucherAmountCents?: number | null
  createdAt: string
  updatedAt: string
}

export interface DriverEarning {
  id: number
  driverId: number
  collectionId: number
  amountCents: number
  createdAt: string
}

export interface DriverEarningsBalance {
  balanceCents: number
  earnings: DriverEarning[]
}

export interface DriverPayout {
  id: number
  driverId: number
  amountCents: number
  note: string | null
  createdAt: string
}

export interface PendingClaimItem {
  claimId: string
  status: 'Pending'
  retailer?: string
  amountCents?: number
  ts?: string
}


