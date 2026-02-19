'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface FormValues {
  name: string
  email: string
  phone: string
  company: string
  status: string
  notes: string
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: '取引中' },
  { value: 'PROSPECT', label: '見込み' },
  { value: 'INACTIVE', label: '休眠'   },
]

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormValues>({
    name: '', email: '', phone: '', company: '', status: 'PROSPECT', notes: '',
  })

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d: { customer?: Customer; error?: string }) => {
        if (d.error) {
          setError(d.error)
        } else if (d.customer) {
          setCustomer(d.customer)
          setForm({
            name:    d.customer.name    ?? '',
            email:   d.customer.email   ?? '',
            phone:   d.customer.phone   ?? '',
            company: d.customer.company ?? '',
            status:  d.customer.status  ?? 'PROSPECT',
            notes:   d.customer.notes   ?? '',
          })
        }
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました')
        return
      }
      setCustomer(data.customer)
      setEditing(false)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (customer) {
      setForm({
        name:    customer.name    ?? '',
        email:   customer.email   ?? '',
        phone:   customer.phone   ?? '',
        company: customer.company ?? '',
        status:  customer.status  ?? 'PROSPECT',
        notes:   customer.notes   ?? '',
      })
    }
    setError('')
    setEditing(false)
  }

  if (loading) {
    return (
      <PageLayout title="顧客詳細">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </PageLayout>
    )
  }

  if (error && !customer) {
    return (
      <PageLayout title="顧客詳細">
        <p className="text-sm text-red-600">{error}</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="顧客詳細・編集">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/customers')}
            data-testid="back-button"
          >
            ← 一覧に戻る
          </Button>
          {!editing && (
            <Button
              size="sm"
              onClick={() => setEditing(true)}
              data-testid="edit-button"
            >
              編集
            </Button>
          )}
        </div>

        {error && (
          <div
            data-testid="error-message"
            className="px-4 py-3 rounded bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <Card title="基本情報">
          <div className="space-y-4">
            <Input
              id="name"
              label="顧客名 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              readOnly={!editing}
              required
              data-testid="name-input"
            />
            <Input
              id="company"
              label="会社名"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              readOnly={!editing}
              data-testid="company-input"
            />
            <Input
              id="email"
              label="メールアドレス"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              readOnly={!editing}
              data-testid="email-input"
            />
            <Input
              id="phone"
              label="電話番号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              readOnly={!editing}
              data-testid="phone-input"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!editing}
                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                data-testid="status-select"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
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
                readOnly={!editing}
                rows={4}
                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-50 read-only:text-gray-600"
                data-testid="notes-input"
              />
            </div>
          </div>
        </Card>

        {editing && (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              data-testid="save-button"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={saving}
              data-testid="cancel-button"
            >
              キャンセル
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
