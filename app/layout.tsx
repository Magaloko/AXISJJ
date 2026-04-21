import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
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
  icons: {
    icon: [
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    siteName: 'AXIS Jiu-Jitsu Vienna',
    locale: 'de_AT',
    type: 'website',
    images: [
      {
        url: '/images/logo-full.png',
        width: 384,
        height: 147,
        alt: 'AXIS Jiu-Jitsu Vienna',
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${interTight.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  )
}
