'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: string
  createdAt: string
}

interface ApiResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: '取引中',  className: 'bg-green-100 text-green-800' },
  INACTIVE: { label: '休眠',    className: 'bg-gray-100  text-gray-600'  },
  PROSPECT: { label: '見込み',  className: 'bg-blue-100  text-blue-800'  },
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (p: number, q: string, s: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    if (s) params.set('status', s)
    try {
      const res = await fetch(`/api/customers?${params}`)
      const data: ApiResponse = await res.json()
      setCustomers(data.customers ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(data.page ?? 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers(1, search, statusFilter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    fetchCustomers(1, search, statusFilter)
  }

  const handleStatusChange = (s: string) => {
    setStatusFilter(s)
    fetchCustomers(1, search, s)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよいですか？`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      fetchCustomers(page, search, statusFilter)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageLayout title="顧客一覧">
      <div className="space-y-4">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <Input
                label="検索"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="顧客名・会社名・メールアドレス"
                data-testid="search-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="status-filter"
              >
                <option value="">すべて</option>
                <option value="ACTIVE">取引中</option>
                <option value="PROSPECT">見込み</option>
                <option value="INACTIVE">休眠</option>
              </select>
            </div>
            <Button onClick={handleSearch} data-testid="search-button">
              検索
            </Button>
            <Link href="/customers/new">
              <Button data-testid="new-customer-button">＋ 新規登録</Button>
            </Link>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {loading ? '読み込み中...' : `${total} 件`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-gray-200 text-sm"
              data-testid="customers-table"
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">顧客名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">会社名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メール</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">電話番号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {!loading && customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      顧客データがありません
                    </td>
                  </tr>
                )}
                {customers.map((c) => {
                  const status = STATUS_LABELS[c.status] ?? { label: c.status, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                      data-testid={`customer-row-${c.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/customers/${c.id}`}
                          className="hover:text-blue-700 hover:underline"
                          data-testid={`customer-link-${c.id}`}
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.company ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/customers/${c.id}`)}
                            data-testid={`edit-button-${c.id}`}
                          >
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingId === c.id}
                            onClick={() => handleDelete(c.id, c.name)}
                            data-testid={`delete-button-${c.id}`}
                          >
                            削除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {page} / {totalPages} ページ
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => fetchCustomers(page - 1, search, statusFilter)}
                  data-testid="prev-page-button"
                >
                  ← 前へ
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => fetchCustomers(page + 1, search, statusFilter)}
                  data-testid="next-page-button"
                >
                  次へ →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
