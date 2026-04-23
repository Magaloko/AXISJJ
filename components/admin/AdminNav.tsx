'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users, Award,
  ClipboardList, Settings, LogOut, Building2, ScrollText,
  BookOpen, MonitorPlay, FileText, GraduationCap, MoreHorizontal, X, Trophy,
  UsersRound, FileUp, Megaphone, Code2, Palette,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { translations, type Lang } from '@/lib/i18n'
import gymConfig from '@/gym.config'

type Role = 'coach' | 'owner' | 'developer'

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
    { href: '/admin/mitglieder',    label: n.mitglieder,    Icon: Users },
    { href: '/admin/gruppen',       label: 'Gruppen',       Icon: UsersRound },
    { href: '/admin/guertel',       label: n.guertel,       Icon: Award },
    { href: '/admin/leads',         label: n.leads,         Icon: ClipboardList },
    { href: '/admin/vertrag-upload', label: 'Vertrag-Upload', Icon: FileUp },
  ]
}

function getBusinessItems(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/berichte',   label: n.berichte,    Icon: FileText },
    { href: '/admin/broadcast',  label: 'Broadcast',   Icon: Megaphone },
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

function getDeveloperItems(): NavItem[] {
  return [
    { href: '/admin/developer',       label: 'Developer Panel', Icon: Code2 },
    { href: '/admin/developer/theme', label: 'Website-Theme',   Icon: Palette },
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

function getDeveloperMoreItems(lang: Lang, role: Role): NavItem[] {
  // In public-only mode: only content + system + developer (no ops/mitglieder/business)
  if (gymConfig.mode === 'public-only') {
    return [
      ...getContentItems(lang),
      ...getSystemItems(lang),
      ...getDeveloperItems(),
    ]
  }
  // Full mode: everything available to role + developer section
  return [
    ...(role === 'owner' || role === 'developer' ? getOwnerMoreItems(lang) : []),
    ...getDeveloperItems(),
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
  const devItems = getDeveloperItems()
  const isOwnerLevel = role === 'owner' || role === 'developer'

  return (
    <>
      <div className="border-b border-border p-6">
        <p className={`text-xs font-bold uppercase tracking-widest ${role === 'developer' ? 'text-violet-500' : 'text-primary'}`}>
          {roleBadge}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {gymConfig.mode === 'full' && (
          <>
            {isOwnerLevel && <SectionLabel label={s.ops} />}
            {opsItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            {isOwnerLevel && (
              <>
                <SectionLabel label={s.mitglieder} />
                {mitgliederItems.map(item => (
                  <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
                ))}

                <SectionLabel label={s.business} />
                {businessItems.map(item => (
                  <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
                ))}
              </>
            )}
          </>
        )}

        {isOwnerLevel && (
          <>
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

        {role === 'developer' && (
          <>
            <SectionLabel label="Developer" />
            {devItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-violet-500/10 text-violet-600'
                    : 'text-violet-500 hover:bg-violet-500/10 hover:text-violet-600'
                }`}
              >
                <item.Icon size={16} />
                {item.label}
              </Link>
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

function getPublicOnlyBottomTabs(lang: Lang): NavItem[] {
  const n = translations[lang].admin.nav
  return [
    { href: '/admin/gym',           label: n.gym,           Icon: Building2 },
    { href: '/admin/einstellungen', label: n.einstellungen, Icon: Settings },
    { href: '/admin/hero',          label: n.hero,          Icon: MonitorPlay },
  ]
}

function BottomBar({ role, pathname, onMoreClick, currentLang }: BottomBarProps) {
  const tabs = gymConfig.mode === 'public-only'
    ? getPublicOnlyBottomTabs(currentLang)
    : role === 'coach' ? getCoachBottomTabs(currentLang) : getOwnerBottomTabs(currentLang)
  // Mehr button: always available for owner/developer (full + public-only mode)
  const showMore = role === 'owner' || role === 'developer'
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
      {showMore && (
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
  role: Role
  pathname: string
  onClose: () => void
  onLogout: () => void
  currentLang: Lang
}

function MoreSheet({ role, pathname, onClose, onLogout, currentLang }: MoreSheetProps) {
  const t = translations[currentLang].admin
  const moreItems = role === 'developer'
    ? getDeveloperMoreItems(currentLang, role)
    : getOwnerMoreItems(currentLang)

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
          {moreItems.map(({ href, label, Icon }) => {
            const isDevItem = href.startsWith('/admin/developer')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(href)
                    ? isDevItem ? 'bg-violet-500/10 text-violet-600' : 'bg-primary/10 text-primary'
                    : isDevItem ? 'text-violet-500 hover:bg-violet-500/10 hover:text-violet-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
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

  const roleBadge =
    role === 'developer' ? 'AXIS Developer' :
    role === 'owner'     ? 'AXIS Owner'     : 'AXIS Coach'

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

      {/* Owner/Developer "Mehr" sheet */}
      {moreOpen && (
        <MoreSheet
          role={role}
          pathname={pathname}
          onClose={() => setMoreOpen(false)}
          onLogout={handleLogout}
          currentLang={currentLang}
        />
      )}
    </>
  )
}
