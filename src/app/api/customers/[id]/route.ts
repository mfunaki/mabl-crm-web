import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const

const updateCustomerSchema = z.object({
  name: z.string().min(1, '顧客名を入力してください').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().optional(),
})

type RouteContext = { params: { id: string } }

export async function GET(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json({ error: '顧客が見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '顧客が見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateCustomerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'リクエストが不正です' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ customer })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '顧客が見つかりません' }, { status: 404 })
    }

    await prisma.customer.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
