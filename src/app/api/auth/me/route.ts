import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const authUser = await getAuthUserFromRequest(request)

    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
