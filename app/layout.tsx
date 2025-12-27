import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Is Cleveland Busy Today?',
  description: 'Check if downtown Cleveland will be busy for parking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

