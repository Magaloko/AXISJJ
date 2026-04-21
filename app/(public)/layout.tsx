import { cookies } from 'next/headers'
import { NavBar } from '@/components/public/NavBar'
import { Footer } from '@/components/public/Footer'
import { CookieBanner } from '@/components/public/CookieBanner'
import { resolveLang } from '@/lib/i18n/resolve-lang'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)

  return (
    <>
      <NavBar currentLang={lang} />
      <main>{children}</main>
      <Footer lang={lang} />
      <CookieBanner lang={lang} />
    </>
  )
}
