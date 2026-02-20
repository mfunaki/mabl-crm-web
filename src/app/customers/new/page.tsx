'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface FormValues {
  name: string
  email: string
  phone: string
  company: string
  status: string
  notes: string
}

interface FormErrors {
  name?: string
  email?: string
  status?: string
}

const STATUS_OPTIONS = [
  { value: 'PROSPECT', label: '見込み' },
  { value: 'ACTIVE', label: '取引中' },
  { value: 'INACTIVE', label: '休眠' },
]

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'PROSPECT',
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = '顧客名は必須です'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? '登録に失敗しました')
        return
      }

      router.push('/customers')
    } catch {
      setApiError('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="新規顧客登録">
      <div className="max-w-2xl space-y-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/customers')}
          data-testid="back-button"
        >
          ← 一覧に戻る
        </Button>

        {apiError && (
          <div
            data-testid="error-message"
            className="px-4 py-3 rounded bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Card title="顧客情報">
            <div className="space-y-4">
              <Input
                id="name"
                label="顧客名 *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                placeholder="例: 田中 一郎"
                required
                data-testid="name-input"
              />
              <Input
                id="company"
                label="会社名"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="例: 株式会社サンプル"
                data-testid="company-input"
              />
              <Input
                id="email"
                label="メールアドレス"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                placeholder="例: tanaka@example.co.jp"
                data-testid="email-input"
              />
              <Input
                id="phone"
                label="電話番号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="例: 03-1234-5678"
                data-testid="phone-input"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="status-select"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="顧客に関するメモを入力"
                  data-testid="notes-input"
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3 mt-4">
            <Button type="submit" disabled={saving} data-testid="save-button">
              {saving ? '登録中...' : '登録'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/customers')}
              disabled={saving}
              data-testid="cancel-button"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
