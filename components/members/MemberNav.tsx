// components/members/MemberNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, Award, BookOpen, Settings, LogOut, GraduationCap, Scale, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { translations, type Lang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

function navItems(lang: Lang): NavItem[] {
  const t = translations[lang].nav
  return [
    { href: '/dashboard',     label: t.dashboard, Icon: LayoutDashboard },
    { href: '/buchen',        label: t.buchen,    Icon: Calendar },
    { href: '/mein-training',      label: 'Training',   Icon: GraduationCap },
    { href: '/dashboard/turniere', label: 'Turniere',   Icon: Trophy },
    { href: '/bjj-rules',          label: 'BJJ Regeln', Icon: Scale },
    { href: '/leaderboard',   label: 'Leaderboard', Icon: Trophy },
    { href: '/gurtel',        label: t.gurtel,    Icon: Award },
    { href: '/skills',        label: t.skills,    Icon: BookOpen },
    { href: '/konto',         label: t.konto,     Icon: Settings },
  ]
}

interface Props {
  userName: string
  lang?: Lang
}

export function MemberNav({ userName, lang = 'de' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const items = navItems(lang)

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex"
        aria-label="Mitglieder Navigation"
      >
        <div className="border-b border-border p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">AXIS Member</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          <LanguageSwitcher currentLang={lang} variant="full" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card lg:hidden"
        aria-label="Mobile Navigation"
      >
        {items.slice(0, 4).map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </>
  )
}
