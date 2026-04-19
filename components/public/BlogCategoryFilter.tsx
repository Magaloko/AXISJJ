'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const CATEGORIES = [
  'All', 'Techniques', 'Rules & Scoring', 'History', 'Belt System',
  'Competition', 'Mindset', 'Nutrition', 'No-Gi', 'Kids BJJ',
]

export function BlogCategoryFilter({ active }: { active: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleSelect(cat: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="overflow-x-auto bg-foreground">
      <div className="flex min-w-max">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
              active === cat
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/50 hover:text-foreground/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
