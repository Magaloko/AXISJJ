// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/members/dashboard'
    const safePath = next.startsWith('/') ? next : '/members/dashboard'

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
                return NextResponse.redirect(new URL(safePath, origin))
        }
  }

  // code flow — used by OAuth / PKCE
  if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
                return NextResponse.redirect(new URL(safePath, origin))
        }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_error', origin))
}
