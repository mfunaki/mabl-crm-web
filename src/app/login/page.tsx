'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'ログインに失敗しました')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">CRM システム</h1>
          <p className="mt-1 text-sm text-gray-500">顧客管理システムへログイン</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-base font-semibold text-gray-800 mb-6">ログイン</h2>

          {error && (
            <div
              data-testid="error-message"
              className="mb-4 px-4 py-3 rounded bg-red-50 border border-red-200 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@demo.com"
              autoComplete="email"
              required
              data-testid="email-input"
            />

            <Input
              id="password"
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          デモ: admin@demo.com / password123
        </p>
      </div>
    </div>
  )
}
