import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-for-test'
const secret = new TextEncoder().encode(JWT_SECRET)

export const TOKEN_COOKIE_NAME = 'auth-token'

export async function generateToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JWTPayload
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE_NAME}=([^;]+)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

export async function getAuthUserFromRequest(
  request: Request
): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null

  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}
