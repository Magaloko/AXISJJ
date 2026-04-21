import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  FlameIcon,
  LightningIcon,
  TrophyIcon,
  MedalIcon,
  AnimatedCheckIcon,
  TargetIcon,
  StrengthIcon,
  AnimatedGiIcon,
} from '../animated-icons'

describe('Animated Icons', () => {
  it('renders FlameIcon with default size', () => {
    const { container } = render(<FlameIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  it('respects custom size prop', () => {
    const { container } = render(<LightningIcon size={48} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
    expect(svg?.getAttribute('height')).toBe('48')
  })

  it('applies custom className', () => {
    const { container } = render(<TrophyIcon className="text-red-500" animate={false} />)
    const svg = container.querySelector('svg')
    expect(svg?.className.baseVal).toContain('text-red-500')
  })

  it('renders MedalIcon with gold color for place 1', () => {
    const { container } = render(<MedalIcon place={1} />)
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('1')
  })

  it('renders MedalIcon with silver for place 2', () => {
    const { container } = render(<MedalIcon place={2} />)
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('2')
  })

  it('renders MedalIcon with bronze for place 3', () => {
    const { container } = render(<MedalIcon place={3} />)
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('3')
  })

  it('renders AnimatedCheckIcon with circle and polyline', () => {
    const { container } = render(<AnimatedCheckIcon />)
    expect(container.querySelector('circle')).toBeTruthy()
    expect(container.querySelector('polyline')).toBeTruthy()
  })

  it('renders TargetIcon with three circles', () => {
    const { container } = render(<TargetIcon />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(3)
  })

  it('renders StrengthIcon as motion svg', () => {
    const { container } = render(<StrengthIcon />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders AnimatedGiIcon', () => {
    const { container } = render(<AnimatedGiIcon />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('accepts animate="false" to disable animation', () => {
    const { container } = render(<FlameIcon animate={false} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('accepts animate="hover" trigger', () => {
    const { container } = render(<LightningIcon animate="hover" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
