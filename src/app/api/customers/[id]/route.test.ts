// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getAuthUserFromRequest: vi.fn(),
  }
})

import { GET, PUT, DELETE } from './route'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

const mockCustomer = {
  id: 'cust-1',
  name: '田中 一郎',
  email: 'tanaka@example.co.jp',
  phone: '03-1234-5678',
  company: '株式会社田中商事',
  status: 'ACTIVE',
  notes: null,
  createdAt: new Date('2026-02-01'),
  updatedAt: new Date('2026-02-01'),
  createdById: 'user-id-1',
}

const mockAuthUser = {
  userId: 'user-id-1',
  email: 'admin@demo.com',
  role: 'ADMIN' as const,
}

const mockParams = { params: { id: 'cust-1' } }

describe('GET /api/customers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('IDに対応する顧客情報を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers/cust-1', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await GET(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('customer')
    expect(data.customer.id).toBe('cust-1')
    expect(data.customer.name).toBe('田中 一郎')
  })

  it('存在しないIDは404を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/not-exist', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await GET(request, { params: { id: 'not-exist' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/cust-1')
    const response = await GET(request, mockParams)

    expect(response.status).toBe(401)
  })
})

describe('PUT /api/customers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('顧客の名前を更新できる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)
    vi.mocked(prisma.customer.update).mockResolvedValue({
      ...mockCustomer,
      name: '田中 太郎',
    })

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ name: '田中 太郎' }),
    })

    const response = await PUT(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('customer')
    expect(data.customer.name).toBe('田中 太郎')
  })

  it('ステータスを更新できる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)
    vi.mocked(prisma.customer.update).mockResolvedValue({
      ...mockCustomer,
      status: 'INACTIVE',
    })

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ status: 'INACTIVE' }),
    })

    const response = await PUT(request, mockParams)
    expect(response.status).toBe(200)
  })

  it('存在しないIDは404を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/not-exist', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ name: '田中 太郎' }),
    })

    const response = await PUT(request, { params: { id: 'not-exist' } })
    expect(response.status).toBe(404)
  })

  it('不正なemail形式は400を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    const response = await PUT(request, mockParams)
    expect(response.status).toBe(400)
  })

  it('不正なstatus値は400を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ status: 'INVALID' }),
    })

    const response = await PUT(request, mockParams)
    expect(response.status).toBe(400)
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    })

    const response = await PUT(request, mockParams)
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/customers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('顧客を削除して200を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer)
    vi.mocked(prisma.customer.delete).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'DELETE',
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await DELETE(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
  })

  it('存在しないIDは404を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/not-exist', {
      method: 'DELETE',
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await DELETE(request, { params: { id: 'not-exist' } })
    expect(response.status).toBe(404)
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers/cust-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    expect(response.status).toBe(401)
  })
})
