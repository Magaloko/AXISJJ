// components/admin/AdminStatCard.tsx
interface AdminStatCardProps {
  label: string
  value: number | string
  highlight?: boolean
}

export function AdminStatCard({ label, value, highlight = false }: AdminStatCardProps) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-4xl font-black ${highlight ? 'text-primary' : 'text-foreground'}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </p>
    </div>
  )
}
