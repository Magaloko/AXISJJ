import { NextResponse } from 'next/server'
import { getRandomRuleCard } from '@/app/actions/rule-cards'

export async function GET() {
  const result = await getRandomRuleCard()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(result.card)
}
