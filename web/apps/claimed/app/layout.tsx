import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Web3Provider } from './providers'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CATBOTICA — Lunar New Year 2026 | Year of the Fire Horse',
  description: 'Celebrate the Year of the Fire Horse with Catbotica. Claim your exclusive Lunar New Year badge.',
  openGraph: {
    title: 'CATBOTICA — Lunar New Year 2026',
    description: 'Year of the Fire Horse — Claim your exclusive badge',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
