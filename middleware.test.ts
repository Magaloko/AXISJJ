import { describe, it, expect } from 'vitest'

function shouldProtect(pathname: string): 'members' | 'admin' | 'public' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/members')) return 'members'
  return 'public'
}

describe('middleware route classification', () => {
  it('classifies /members/* as protected', () => {
    expect(shouldProtect('/members/dashboard')).toBe('members')
    expect(shouldProtect('/members/buchen')).toBe('members')
  })
  it('classifies /admin/* as admin-protected', () => {
    expect(shouldProtect('/admin/dashboard')).toBe('admin')
  })
  it('classifies public routes as public', () => {
    expect(shouldProtect('/')).toBe('public')
    expect(shouldProtect('/trial')).toBe('public')
    expect(shouldProtect('/login')).toBe('public')
  })
})
