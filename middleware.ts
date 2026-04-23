import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import gymConfig from '@/gym.config'

const ADMIN_PUBLIC_WHITELIST = [
  '/admin/gym',
  '/admin/einstellungen',
  '/admin/hero',
  '/admin/klassen',
  '/admin/turniere',
  '/admin/blog',
  '/admin/developer',
]

const MEMBER_PATHS = ['/dashboard', '/buchen', '/gurtel', '/konto', '/skills']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── White-label: public-only mode ────────────────────────────────────────
  if (gymConfig.mode === 'public-only') {
    // Member routes: owner → admin, guest → home
    if (MEMBER_PATHS.some(p => pathname.startsWith(p))) {
      const target = user ? '/admin/gym' : '/'
      return NextResponse.redirect(new URL(target, request.url))
    }

    // update-password: needed for invite flow — allow through
    // (no member dashboard exists anyway)

    // Admin routes: only whitelist allowed
    if (pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      const allowed = ADMIN_PUBLIC_WHITELIST.some(p => pathname.startsWith(p))
      if (!allowed) {
        return NextResponse.redirect(new URL('/admin/gym', request.url))
      }
      return supabaseResponse
    }

    // Login: logged-in owner goes straight to admin
    if (pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/admin/gym', request.url))
    }

    return supabaseResponse
  }
  // ── End public-only ───────────────────────────────────────────────────────

  // ── Full mode: standard auth guards ──────────────────────────────────────
  const isMemberPath = MEMBER_PATHS.some(p => pathname.startsWith(p))
  if (isMemberPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/update-password') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['coach', 'owner', 'developer'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
