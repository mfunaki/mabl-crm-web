import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

// Next.js router モック
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))

// fetch モック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          totalCustomers: 25,
          activeCustomers: 13,
          prospects: 7,
          newThisMonth: 3,
        }),
    })
  })

  it('ローディング中にテキストが表示される', () => {
    mockFetch.mockReturnValue(new Promise(() => {})) // pending
    render(<Home />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })
})
