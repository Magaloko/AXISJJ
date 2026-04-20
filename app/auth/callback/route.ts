// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

async function ensureProfileAndNotify(
  supabase: ReturnType<typeof createServerClient>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', user.id)
      .single()

    // Auto-create profile on first login if missing (e.g. signup via magic link).
    if (!profile) {
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        (user.email ? user.email.split('@')[0] : 'Unbekannt')
      const email = user.email ?? ''

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        email,
        role: 'member',
        language: 'de',
      })
      if (insertError) {
        console.error('[auth/callback] profile auto-create failed:', insertError)
        return
      }

      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .eq('id', user.id)
        .single()
      profile = freshProfile
    }

    if (!profile) return
    const createdAt = new Date((profile as { created_at: string }).created_at).getTime()
    const age = Date.now() - createdAt
    const type = age < 10_000 ? 'user.registered' : 'user.login'
    waitUntil(notify({
      type,
      data: {
        full_name: (profile as { full_name?: string }).full_name ?? 'Unbekannt',
        email: (profile as { email?: string }).email ?? '',
      },
    }))
  } catch (err) {
    console.error('[auth/callback] ensureProfile error:', err)
  }
}

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'
    const safePath = next.startsWith('/') ? next : '/dashboard'

  const cookieStore = await cookies()
    const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
              cookies: {
                        getAll() { return cookieStore.getAll() },
                        setAll(cookiesToSet) {
                                    try {
                                                  cookiesToSet.forEach(({ name, value, options }) =>
                                                                  cookieStore.set(name, value, options)
                                                                                   )
                                    } catch {
                                                  // Cookie setting may fail in middleware context — safe to ignore
                                    }
                        },
              },
      }
        )

  // token_hash flow — used by magic link email template
  if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as never })
        if (!error) {
                await ensureProfileAndNotify(supabase)
                return NextResponse.redirect(new URL(safePath, origin))
        }
  }

  // code flow — used by OAuth / PKCE
  if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
                await ensureProfileAndNotify(supabase)
                return NextResponse.redirect(new URL(safePath, origin))
        }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_error', origin))
}
