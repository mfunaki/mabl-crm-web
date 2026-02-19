import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)

    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalCustomers, activeCustomers, prospects, newThisMonth] =
      await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { status: 'ACTIVE' } }),
        prisma.customer.count({ where: { status: 'PROSPECT' } }),
        prisma.customer.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ])

    return NextResponse.json({
      totalCustomers,
      activeCustomers,
      prospects,
      newThisMonth,
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
