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

// bcryptjs をモック
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  compare: vi.fn(),
}))

// auth モジュールをモック（JWT生成）
vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    generateToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  }
})

import { POST } from './route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正しいメールアドレスとパスワードでJWTクッキーとユーザー情報が返る', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('user')
    expect(data.user.email).toBe('admin@demo.com')
    expect(data.user).not.toHaveProperty('password')
  })

  it('存在しないメールアドレスは401を返す', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'notexist@demo.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
  })

  it('パスワード不一致は401を返す', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
  })

  it('メールアドレスなしは400を返す', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'password123' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('不正なメールアドレス形式は400を返す', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: 'password123' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('パスワードなしは400を返す', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
