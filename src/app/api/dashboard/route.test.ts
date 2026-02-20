// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      count: vi.fn(),
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

import { GET } from './route'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('認証済みユーザーにダッシュボードデータを返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue({
      userId: 'user-id-1',
      email: 'admin@demo.com',
      role: 'ADMIN',
    })
    vi.mocked(prisma.customer.count)
      .mockResolvedValueOnce(25) // totalCustomers
      .mockResolvedValueOnce(13) // activeCustomers
      .mockResolvedValueOnce(7) // prospects
      .mockResolvedValueOnce(3) // newThisMonth

    const request = new Request('http://localhost/api/dashboard', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalCustomers: 25,
      activeCustomers: 13,
      prospects: 7,
      newThisMonth: 3,
    })
  })

  it('集計クエリが正しい条件で呼ばれる', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue({
      userId: 'user-id-1',
      email: 'admin@demo.com',
      role: 'ADMIN',
    })
    vi.mocked(prisma.customer.count)
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(13)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)

    const request = new Request('http://localhost/api/dashboard', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    await GET(request)

    expect(prisma.customer.count).toHaveBeenCalledTimes(4)
    // 2回目: ACTIVE フィルター
    expect(vi.mocked(prisma.customer.count).mock.calls[1][0]).toEqual({
      where: { status: 'ACTIVE' },
    })
    // 3回目: PROSPECT フィルター
    expect(vi.mocked(prisma.customer.count).mock.calls[2][0]).toEqual({
      where: { status: 'PROSPECT' },
    })
    // 4回目: 今月フィルター（createdAt の gte が含まれる）
    expect(
      vi.mocked(prisma.customer.count).mock.calls[3][0]?.where?.createdAt
    ).toHaveProperty('gte')
  })

  it('JWTなしは401を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue(null)

    const request = new Request('http://localhost/api/dashboard')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
  })

  it('DBエラー時は500を返す', async () => {
    vi.mocked(getAuthUserFromRequest).mockResolvedValue({
      userId: 'user-id-1',
      email: 'admin@demo.com',
      role: 'ADMIN',
    })
    vi.mocked(prisma.customer.count).mockRejectedValueOnce(
      new Error('DB connection error')
    )

    const request = new Request('http://localhost/api/dashboard', {
      headers: { cookie: 'auth-token=valid-token' },
    })

    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
