import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const

const createCustomerSchema = z.object({
  name: z.string().min(1, '顧客名を入力してください'),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(VALID_STATUSES).optional().default('PROSPECT'),
  notes: z.string().optional(),
})

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const statusParam = searchParams.get('status') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20'))
    )
    const skip = (page - 1) * limit

    type WhereClause = {
      status?: string
      OR?: {
        name?: { contains: string }
        company?: { contains: string }
        email?: { contains: string }
      }[]
    }

    const where: WhereClause = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (
      statusParam &&
      (VALID_STATUSES as readonly string[]).includes(statusParam)
    ) {
      where.status = statusParam
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createCustomerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'リクエストが不正です' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        ...parsed.data,
        createdById: authUser.userId,
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
