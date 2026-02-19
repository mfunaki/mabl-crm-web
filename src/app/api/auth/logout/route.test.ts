// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { POST } from './route'

describe('POST /api/auth/logout', () => {
  it('200を返してクッキーを削除する', async () => {
    const request = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)

    // Set-Cookie ヘッダーでクッキーが削除されることを確認
    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).not.toBeNull()
    expect(setCookieHeader).toContain('auth-token')
  })

  it('ログイン済みでなくても200を返す', async () => {
    const request = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })
})
