import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const localePrefix = locales.find(l => l !== defaultLocale && pathname.startsWith(`/${l}/`))
  const canonicalPath = localePrefix ? pathname.replace(`/${localePrefix}`, '') : pathname

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
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const prefix = localePrefix ? `/${localePrefix}` : ''

  const memberPaths = ['/dashboard', '/buchen', '/gurtel', '/konto', '/skills', '/update-password']
  if (memberPaths.some(p => canonicalPath.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL(`${prefix}/login`, request.url))
  }

  if (canonicalPath.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL(`${prefix}/login`, request.url))
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['coach', 'owner'].includes(profile.role)) {
      return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url))
    }
  }

  if (canonicalPath === '/login' && user) {
    return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
