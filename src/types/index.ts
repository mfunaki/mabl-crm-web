export type UserRole = 'ADMIN' | 'USER'
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: CustomerStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiError {
  error: string
}
