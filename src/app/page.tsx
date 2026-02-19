'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'

interface DashboardData {
  totalCustomers: number
  activeCustomers: number
  prospects: number
  newThisMonth: number
}

interface KpiCardProps {
  label: string
  value: number | string
  color: string
  testId: string
}

function KpiCard({ label, value, color, testId }: KpiCardProps) {
  return (
    <div
      data-testid={testId}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-5 border-l-4 ${color}`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData & { error?: string }) => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
        }
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout title="ダッシュボード">
      {loading && <p className="text-sm text-gray-500">読み込み中...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="総顧客数"
              value={data.totalCustomers}
              color="border-l-blue-500"
              testId="total-customers-card"
            />
            <KpiCard
              label="取引中"
              value={data.activeCustomers}
              color="border-l-green-500"
              testId="active-customers-card"
            />
            <KpiCard
              label="見込み客"
              value={data.prospects}
              color="border-l-yellow-500"
              testId="prospects-card"
            />
            <KpiCard
              label="今月の新規"
              value={data.newThisMonth}
              color="border-l-purple-500"
              testId="new-this-month-card"
            />
          </div>

          <Card title="クイックアクセス">
            <div className="flex gap-3">
              <Link
                href="/customers"
                data-testid="customers-link"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                👥 顧客一覧を見る
              </Link>
              <Link
                href="/customers/new"
                data-testid="new-customer-link"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                ＋ 新規顧客登録
              </Link>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
