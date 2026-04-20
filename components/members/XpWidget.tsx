import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTotalXp, progressToNextLevel } from '@/lib/gamification'
import { Sparkles } from 'lucide-react'

export async function XpWidget({ profileId }: { profileId: string }) {
  const supabase = await createClient()
  const [totalXp, { data: recentBadges }] = await Promise.all([
    getTotalXp(supabase, profileId),
    supabase
      .from('member_badges')
      .select('earned_at, badges(code, name, icon)')
      .eq('profile_id', profileId)
      .order('earned_at', { ascending: false })
      .limit(3),
  ])

  const progress = progressToNextLevel(totalXp)
  const badges = (recentBadges ?? []).map(b => {
    const badge = Array.isArray(b.badges) ? b.badges[0] : b.badges
    return badge ? { name: badge.name, icon: badge.icon } : null
  }).filter((b): b is { name: string; icon: string } => b !== null)

  return (
    <Link href="/mein-training" className="block border border-border bg-card p-5 hover:border-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Sparkles size={12} /> Mein Fortschritt
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">Level {progress.level}</span>
            <span className="font-mono text-xs text-muted-foreground">{totalXp} XP</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {progress.current}/{progress.needed} zum nächsten Level
          </p>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Badges</p>
            <div className="flex gap-1 text-xl">
              {badges.map((b, i) => <span key={i} title={b.name}>{b.icon}</span>)}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
