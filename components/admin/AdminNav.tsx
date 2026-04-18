// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckSquare, CalendarDays, Users, Award, ClipboardList, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

type Role = 'coach' | 'owner'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
  phase2b?: boolean
}

const opsItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',   label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',   label: 'Klassen',   Icon: CalendarDays },
]

const managementItems: NavItem[] = [
  { href: '/admin/mitglieder',    label: 'Mitglieder',    Icon: Users },
  { href: '/admin/guertel',       label: 'Gürtel',        Icon: Award,          phase2b: true },
  { href: '/admin/leads',         label: 'Leads',         Icon: ClipboardList,  phase2b: true },
  { href: '/admin/einstellungen', label: 'Einstellungen', Icon: Settings,       phase2b: true },
]

interface Props {
  role: Role
  userName: string
}

export function AdminNav({ role, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleBadge = role === 'owner' ? 'AXIS Owner' : 'AXIS Coach'

  function NavContent() {
    return (
      <>
        <div className="border-b border-border p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{roleBadge}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {/* OPS section label — only shown for owner */}
          {role === 'owner' && (
            <p className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              OPS
            </p>
          )}
          {opsItems.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
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

          {/* MANAGEMENT section — owner only */}
          {role === 'owner' && (
            <>
              <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                MANAGEMENT
              </p>
              {managementItems.map(({ href, label, Icon, phase2b }) => {
                if (phase2b) {
                  return (
                    <div
                      key={href}
                      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                      title="Bald verfügbar"
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={16} />
                        {label}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">
                        Bald
                      </span>
                    </div>
                  )
                }
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
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
            </>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-border bg-card lg:flex">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <span className="text-sm font-bold text-primary">{roleBadge}</span>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 text-muted-foreground"
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
