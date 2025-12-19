import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PayByLink - Pagos Instantáneos en Stellar',
  description: 'Genera enlaces de pago en segundos. Sin registro, sin comisiones ocultas. Powered by Stellar.',
  keywords: ['stellar', 'pagos', 'crypto', 'USDC', 'blockchain', 'latam'],
  authors: [{ name: 'PayByLink Team' }],
  openGraph: {
    title: 'PayByLink - Pagos Instantáneos en Stellar',
    description: 'Cobra en segundos con enlaces de pago inteligentes',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
