// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
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

import { GET, POST } from './route'
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

describe('GET /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('認証済みユーザーに顧客一覧を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer])
    vi.mocked(prisma.customer.count).mockResolvedValue(1)

    const request = new Request('http://localhost/api/customers', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('customers')
    expect(data).toHaveProperty('total', 1)
    expect(data).toHaveProperty('page', 1)
    expect(data).toHaveProperty('totalPages', 1)
    expect(data.customers).toHaveLength(1)
  })

  it('searchパラメータでOR検索クエリが組み立てられる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer])
    vi.mocked(prisma.customer.count).mockResolvedValue(1)

    const request = new Request(
      'http://localhost/api/customers?search=田中',
      { headers: { cookie: 'auth-token=valid-token' } }
    )

    await GET(request)

    const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0]
    expect(call?.where).toHaveProperty('OR')
  })

  it('statusパラメータでフィルタリングできる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer])
    vi.mocked(prisma.customer.count).mockResolvedValue(1)

    const request = new Request(
      'http://localhost/api/customers?status=ACTIVE',
      { headers: { cookie: 'auth-token=valid-token' } }
    )

    await GET(request)

    const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0]
    expect(call?.where).toMatchObject({ status: 'ACTIVE' })
  })

  it('ページネーションが正しく動作する（page=2, limit=10）', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findMany).mockResolvedValue([])
    vi.mocked(prisma.customer.count).mockResolvedValue(25)

    const request = new Request(
      'http://localhost/api/customers?page=2&limit=10',
      { headers: { cookie: 'auth-token=valid-token' } }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(data.page).toBe(2)
    expect(data.limit).toBe(10)
    expect(data.totalPages).toBe(3)

    const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0]
    expect(call?.skip).toBe(10)
    expect(call?.take).toBe(10)
  })

  it('不正なstatusパラメータは無視される', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.findMany).mockResolvedValue([])
    vi.mocked(prisma.customer.count).mockResolvedValue(0)

    const request = new Request(
      'http://localhost/api/customers?status=INVALID',
      { headers: { cookie: 'auth-token=valid-token' } }
    )

    const response = await GET(request)
    expect(response.status).toBe(200)

    const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0]
    expect(call?.where).not.toHaveProperty('status')
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nameのみで顧客を新規作成できる（201）', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ name: '田中 一郎' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty('customer')
  })

  it('全フィールドで顧客を作成できる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)
    vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({
        name: '田中 一郎',
        email: 'tanaka@example.co.jp',
        phone: '03-1234-5678',
        company: '株式会社田中商事',
        status: 'ACTIVE',
        notes: '定期購入顧客',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('nameなしは400を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正なemail形式は400を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ name: '田中', email: 'not-an-email' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('不正なstatus値は400を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(mockAuthUser)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'auth-token=valid-token',
      },
      body: JSON.stringify({ name: '田中', status: 'INVALID' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '田中 一郎' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
