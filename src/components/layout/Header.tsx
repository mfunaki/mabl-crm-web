'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleLogout}
        data-testid="logout-button"
      >
        ログアウト
      </Button>
    </header>
  )
}
