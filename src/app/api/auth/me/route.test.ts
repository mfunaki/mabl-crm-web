// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Prisma をモック
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// auth モジュールをモック（JWT検証）
vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getAuthUserFromRequest: vi.fn(),
  }
})

import { GET } from './route'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

const mockUser = {
  id: 'user-id-1',
  email: 'admin@demo.com',
  password: '$2b$10$hashedpassword',
  name: '管理者 太郎',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
  customers: [],
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('有効なJWTでユーザー情報が返る', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue({
      userId: 'user-id-1',
      email: 'admin@demo.com',
      role: 'ADMIN',
    })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'auth-token=valid-jwt-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('user')
    expect(data.user.email).toBe('admin@demo.com')
    expect(data.user).not.toHaveProperty('password')
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
  })

  it('有効なJWTだがユーザーがDBに存在しない場合は401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue({
      userId: 'deleted-user-id',
      email: 'deleted@demo.com',
      role: 'USER',
    })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'auth-token=valid-jwt-token',
      },
    })

    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})
