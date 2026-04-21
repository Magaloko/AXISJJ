'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users, Award,
  ClipboardList, Settings, LogOut, Building2, ScrollText,
  BookOpen, MonitorPlay, FileText, GraduationCap, MoreHorizontal, X, Trophy,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { translations, type Lang } from '@/lib/i18n'

type Role = 'coach' | 'owner'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

// ── Nav item factories ───────────────────────────────────────────────────────

function getOpsItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/dashboard', label: n.dashboard, Icon: LayoutDashboard },
    { href: '/admin/checkin',   label: n.checkin,   Icon: CheckSquare },
    { href: '/admin/klassen',   label: n.klassen,   Icon: CalendarDays },
    { href: '/admin/turniere',  label: n.turniere,  Icon: Trophy },
  ]
}

function getMitgliederItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/mitglieder', label: n.mitglieder, Icon: Users },
    { href: '/admin/guertel',    label: n.guertel,    Icon: Award },
    { href: '/admin/leads',      label: n.leads,      Icon: ClipboardList },
  ]
}

function getBusinessItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/berichte', label: n.berichte, Icon: FileText },
  ]
}

function getContentItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/blog',       label: n.blog,       Icon: BookOpen },
    { href: '/admin/curriculum', label: n.curriculum, Icon: GraduationCap },
    { href: '/admin/hero',       label: n.hero,       Icon: MonitorPlay },
  ]
}

function getSystemItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/gym',           label: n.gym,           Icon: Building2 },
    { href: '/admin/einstellungen', label: n.einstellungen, Icon: Settings },
    { href: '/admin/audit',         label: n.audit,         Icon: ScrollText },
  ]
}

function getCoachBottomTabs(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/dashboard', label: n.dashboard, Icon: LayoutDashboard },
    { href: '/admin/checkin',   label: n.checkin,   Icon: CheckSquare },
    { href: '/admin/klassen',   label: n.klassen,   Icon: CalendarDays },
    { href: '/admin/turniere',  label: n.turniere,  Icon: Trophy },
  ]
}

function getOwnerBottomTabs(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/dashboard',  label: n.dashboard,  Icon: LayoutDashboard },
    { href: '/admin/mitglieder', label: n.mitglieder, Icon: Users },
    { href: '/admin/checkin',    label: n.checkin,    Icon: CheckSquare },
    { href: '/admin/berichte',   label: n.berichte,   Icon: FileText },
  ]
}

function getOwnerMoreItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/turniere', label: n.turniere, Icon: Trophy },
    ...getMitgliederItems(lang).filter(i => i.href !== '/admin/mitglieder'),
    ...getContentItems(lang),
    ...getSystemItems(lang),
  ]
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground first:mt-2">
      {label}
    </p>
  )
}

function SidebarLink({ href, label, Icon, active, onClick }: NavItem & { active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}

// ── Desktop sidebar content ──────────────────────────────────────────────────

interface SidebarContentProps {
  role: Role
  roleBadge: string
  userName: string
  pathname: string
  onLogout: () => void
  currentLang: Lang
}

function SidebarContent({ role, roleBadge, userName, pathname, onLogout, currentLang }: SidebarContentProps) {
  const t = translations[currentLang].admin
  const s = t.sections

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const opsItems = getOpsItems(currentLang)
  const mitgliederItems = getMitgliederItems(currentLang)
  const businessItems = getBusinessItems(currentLang)
  const contentItems = getContentItems(currentLang)
  const systemItems = getSystemItems(currentLang)

  return (
    <>
      <div className="border-b border-border p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{roleBadge}</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {role === 'owner' && <SectionLabel label={s.ops} />}
        {opsItems.map(item => (
          <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        {role === 'owner' && (
          <>
            <SectionLabel label={s.mitglieder} />
            {mitgliederItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label={s.business} />
            {businessItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label={s.content} />
            {contentItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label={s.system} />
            {systemItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <LanguageSwitcher currentLang={currentLang} variant="full" />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={16} />
          {t.common.logout}
        </button>
      </div>
    </>
  )
}

// ── Mobile bottom bar ────────────────────────────────────────────────────────

interface BottomBarProps {
  role: Role
  pathname: string
  onMoreClick: () => void
  currentLang: Lang
}

function BottomBar({ role, pathname, onMoreClick, currentLang }: BottomBarProps) {
  const tabs = role === 'coach' ? getCoachBottomTabs(currentLang) : getOwnerBottomTabs(currentLang)
  const more = translations[currentLang].admin.common.more

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border bg-card lg:hidden">
      {tabs.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isActive(href) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
      {role === 'owner' && (
        <button
          onClick={onMoreClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal size={20} />
          {more}
        </button>
      )}
    </nav>
  )
}

// ── Owner "Mehr" bottom sheet ────────────────────────────────────────────────

interface MoreSheetProps {
  pathname: string
  onClose: () => void
  onLogout: () => void
  currentLang: Lang
}

function MoreSheet({ pathname, onClose, onLogout, currentLang }: MoreSheetProps) {
  const t = translations[currentLang].admin
  const ownerMoreItems = getOwnerMoreItems(currentLang)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card pb-6">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-bold text-foreground">{t.common.more}</span>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-1 p-3">
          {ownerMoreItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <LanguageSwitcher currentLang={currentLang} variant="full" />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            {t.common.logout}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────

interface Props {
  role: Role
  userName: string
  currentLang: Lang
}

export function AdminNav({ role, userName, currentLang }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const roleBadge = role === 'owner' ? 'AXIS Owner' : 'AXIS Coach'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-border bg-card lg:flex">
        <SidebarContent
          role={role}
          roleBadge={roleBadge}
          userName={userName}
          pathname={pathname}
          onLogout={handleLogout}
          currentLang={currentLang}
        />
      </aside>

      {/* Mobile bottom bar */}
      <BottomBar
        role={role}
        pathname={pathname}
        onMoreClick={() => setMoreOpen(true)}
        currentLang={currentLang}
      />

      {/* Owner "Mehr" sheet */}
      {moreOpen && (
        <MoreSheet
          pathname={pathname}
          onClose={() => setMoreOpen(false)}
          onLogout={handleLogout}
          currentLang={currentLang}
        />
      )}
    </>
  )
}
