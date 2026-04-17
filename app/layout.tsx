import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AXIS Jiu-Jitsu Vienna — Brazilian Jiu-Jitsu in Wien',
    template: '%s | AXIS JJ Vienna',
  },
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien bei Österreichs erstem tschetschenischen Schwarzgurt. Gi, No-Gi, Kids. Jetzt 1 Woche kostenlos testen.',
  keywords: ['BJJ Wien', 'Brazilian Jiu-Jitsu Vienna', 'AXIS JJ', 'Grappling Wien'],
  openGraph: {
    siteName: 'AXIS Jiu-Jitsu Vienna',
    locale: 'de_AT',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
