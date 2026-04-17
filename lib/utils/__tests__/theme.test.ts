import { describe, it, expect } from 'vitest'
describe('theme tokens', () => {
  it('brand red is valid hex', () => {
    const brandRed = '#dc2626'
    expect(brandRed).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
