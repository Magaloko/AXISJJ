import { NavBar } from '@/components/public/NavBar'
import { Footer } from '@/components/public/Footer'
import { CookieBanner } from '@/components/public/CookieBanner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  )
}
