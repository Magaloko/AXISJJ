// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckSquare, CalendarDays, Users, Award, ClipboardList, Settings, LogOut, Menu, X, Building2, ScrollText, BookOpen, MonitorPlay, FileText } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

type Role = 'coach' | 'owner'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

const opsItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',   label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',   label: 'Training',  Icon: CalendarDays },
]

const managementItems: NavItem[] = [
  { href: '/admin/gym',           label: 'Gym',           Icon: Building2 },
  { href: '/admin/mitglieder',    label: 'Mitglieder',    Icon: Users },
  { href: '/admin/guertel',       label: 'Gürtel',        Icon: Award },
  { href: '/admin/leads',         label: 'Leads',         Icon: ClipboardList },
  { href: '/admin/blog',          label: 'Blog',          Icon: BookOpen },
  { href: '/admin/berichte',     label: 'Berichte',      Icon: FileText },    { href: '/admin/hero',         label: 'Hero Slider',   Icon: MonitorPlay },
  { href: '/admin/einstellungen', label: 'Einstellungen', Icon: Settings },
  { href: '/admin/audit',         label: 'Audit-Log',     Icon: ScrollText },
]

interface NavContentProps {
  role: Role
  roleBadge: string
  userName: string
  pathname: string
  onItemClick: () => void
  onLogout: () => void
}

function NavContent({ role, roleBadge, userName, pathname, onItemClick, onLogout }: NavContentProps) {
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <div className="border-b border-border p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{roleBadge}</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
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
              onClick={onItemClick}
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

        {role === 'owner' && (
          <>
            <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              MANAGEMENT
            </p>
            {managementItems.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onItemClick}
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
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </>
  )
}

interface Props {
  role: Role
  userName: string
}

export function AdminNav({ role, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roleBadge = role === 'owner' ? 'AXIS Owner' : 'AXIS Coach'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navContentProps: NavContentProps = {
    role,
    roleBadge,
    userName,
    pathname,
    onItemClick: () => setMobileOpen(false),
    onLogout: handleLogout,
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-border bg-card lg:flex">
        <NavContent {...navContentProps} />
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
            <NavContent {...navContentProps} />
          </aside>
        </div>
      )}
    </>
  )
}

// trigger redeploy
