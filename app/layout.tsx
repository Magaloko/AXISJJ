import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import gymConfig from '@/gym.config'

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
    default: `${gymConfig.name} — Brazilian Jiu-Jitsu in Wien`,
    template: `%s | ${gymConfig.name}`,
  },
  description: gymConfig.tagline,
  keywords: ['BJJ Wien', 'Brazilian Jiu-Jitsu', gymConfig.name, 'Grappling Wien'],
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
    siteName: gymConfig.name,
    locale: gymConfig.defaultLanguage === 'de' ? 'de_AT' : 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/logo-full1.png',
        width: 1632,
        height: 624,
        alt: gymConfig.name,
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={gymConfig.defaultLanguage}>
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
        style={{
          '--gym-primary': gymConfig.colors.primary,
          '--gym-secondary': gymConfig.colors.secondary,
        } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  )
}
