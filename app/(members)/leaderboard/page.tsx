import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTotalXp, xpToLevel } from '@/lib/gamification'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leaderboard | AXIS' }

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [leaderboardRes, myXp] = await Promise.all([
    supabase.rpc('leaderboard_top', { n: 20 }),
    getTotalXp(supabase, user.id),
  ])

  const myLevel = xpToLevel(myXp)
  const rows = leaderboardRes.data ?? []
  const myRank = rows.findIndex(r => r.profile_id === user.id) + 1 || null

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Top 20 nach gesammelten XP.</p>
      </div>

      <div className="mb-6 border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Du</p>
        <div className="mt-1 flex items-baseline gap-4">
          <span className="text-2xl font-black text-foreground">Level {myLevel}</span>
          <span className="font-mono text-sm text-muted-foreground">{myXp} XP</span>
          {myRank && <span className="text-xs text-primary">#{myRank} im Top 20</span>}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Noch keine XP gesammelt. Sei die/der Erste!
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">#</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Level</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">XP</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Badges</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = r.profile_id === user.id
                const totalXp = Number(r.total_xp ?? 0)
                const level = xpToLevel(totalXp)
                return (
                  <tr key={r.profile_id} className={
                    isMe
                      ? 'border-b border-border/50 bg-primary/5'
                      : 'border-b border-border/50'
                  }>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {i + 1 <= 3 ? <span className="text-base">{['🥇','🥈','🥉'][i]}</span> : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {r.full_name}{isMe && <span className="ml-2 text-[10px] font-bold uppercase text-primary">DU</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Lv. {level}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{totalXp}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.badge_count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
