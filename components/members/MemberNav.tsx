// components/members/MemberNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Award, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { translations, type Lang } from '@/lib/i18n'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

function navItems(lang: Lang): NavItem[] {
  const t = translations[lang].nav
  return [
    { href: '/dashboard', label: t.dashboard, Icon: LayoutDashboard },
    { href: '/buchen',    label: t.buchen,    Icon: Calendar },
    { href: '/gurtel',   label: t.gurtel,    Icon: Award },
    { href: '/skills',   label: t.skills,    Icon: BookOpen },
    { href: '/konto',    label: t.konto,     Icon: Settings },
  ]
}

interface Props {
  userName: string
  lang?: Lang
}

export function MemberNav({ userName, lang = 'de' }: Props) {
  const pathname = usePathname()
  const items = navItems(lang)

  const isActive = (href: string) =>
    pathname === href || (href !== '/members/dashboard' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#080808] lg:flex" aria-label="Mitglieder Navigation">
        <div className="border-b border-white/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">AXIS Member</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{userName}</p>
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
                    ? 'bg-red-600/10 text-red-500'
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/5 bg-[#080808] lg:hidden" aria-label="Mobile Navigation">
        {items.slice(0, 4).map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide transition-colors',
                active ? 'text-red-500' : 'text-gray-600'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
