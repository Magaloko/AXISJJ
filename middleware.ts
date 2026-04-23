import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import gymConfig from '@/gym.config'

// Admin routes accessible in public-only mode (owner manages public content)
const ADMIN_PUBLIC_WHITELIST = [
  '/admin/gym',          // Gym-Info + Öffnungszeiten
  '/admin/einstellungen', // Preise + Coaches + Module
  '/admin/hero',         // Hero-Slides
  '/admin/klassen',      // Stundenplan
  '/admin/turniere',     // Turniere
  '/admin/blog',         // Blog (falls aktiviert)
  '/admin/developer',    // Module ein/aus
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── White-label: public-only mode guard ──────────────────────────────────
  if (gymConfig.mode === 'public-only') {
    // Block all member-facing routes → send to admin for owners
    const memberPaths = ['/dashboard', '/buchen', '/gurtel', '/konto', '/skills', '/update-password']
    if (memberPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/gym', request.url))
    }

    // Restrict admin to whitelist — /login stays accessible for owner
    if (pathname.startsWith('/admin')) {
      const allowed = ADMIN_PUBLIC_WHITELIST.some(p => pathname.startsWith(p))
      if (!allowed) {
        return NextResponse.redirect(new URL('/admin/gym', request.url))
      }
    }
  }
  // ── End white-label guard ─────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect member routes
  const memberPaths = ['/dashboard', '/buchen', '/gurtel', '/konto', '/skills', '/update-password']
  const isMemberPath = memberPaths.some(p => pathname.startsWith(p))
  if (isMemberPath && !user) {
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

  // In public-only mode: logged-in owner goes to admin instead of dashboard
  if (pathname === '/login' && user) {
    const target = gymConfig.mode === 'public-only' ? '/admin/gym' : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
