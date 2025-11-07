import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ESG-rapportering',
  description: 'Overblik over ESG-aktiviteter i et enkelt dashboard',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  )
}
