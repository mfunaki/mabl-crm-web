import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home page', () => {
  it('ダッシュボードのタイトルが表示される', () => {
    render(<Home />)
    expect(screen.getByText('CRM ダッシュボード')).toBeInTheDocument()
  })
})
