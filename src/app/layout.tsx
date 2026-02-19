import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM システム',
  description: '顧客管理システム',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
