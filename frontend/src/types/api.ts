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

export interface PendingClaimItem {
  claimId: string
  status: 'Pending'
  retailer?: string
  amountCents?: number
  ts?: string
}


