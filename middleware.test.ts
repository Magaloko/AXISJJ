import { describe, it, expect } from 'vitest'

// Mirrors the classification logic in middleware.ts.
// Note: (members) is a Next.js route group — URLs are /dashboard, /buchen, etc.
// NOT /members/dashboard.
const MEMBER_PATHS = ['/dashboard', '/buchen', '/gurtel', '/konto', '/skills']

function shouldProtect(pathname: string): 'members' | 'admin' | 'public' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (MEMBER_PATHS.some(p => pathname.startsWith(p))) return 'members'
  return 'public'
}

describe('middleware route classification', () => {
  it('classifies member routes as protected', () => {
    expect(shouldProtect('/dashboard')).toBe('members')
    expect(shouldProtect('/buchen')).toBe('members')
    expect(shouldProtect('/gurtel')).toBe('members')
    expect(shouldProtect('/konto')).toBe('members')
    expect(shouldProtect('/skills')).toBe('members')
  })
  it('classifies /admin/* as admin-protected', () => {
    expect(shouldProtect('/admin/dashboard')).toBe('admin')
    expect(shouldProtect('/admin/guertel')).toBe('admin')
  })
  it('classifies public routes as public', () => {
    expect(shouldProtect('/')).toBe('public')
    expect(shouldProtect('/trial')).toBe('public')
    expect(shouldProtect('/login')).toBe('public')
  })
  it('does not treat /members/* as protected (route group is stripped)', () => {
    // /members/dashboard is NOT a valid URL in this app — (members) is a route
    // group. The correct URL is /dashboard. This guards against regressions where
    // code accidentally generates or navigates to the group-prefixed path.
    expect(shouldProtect('/members/dashboard')).toBe('public')
  })
})
