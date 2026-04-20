'use client'

import Link from 'next/link'
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type PillNavItem = {
  label: string
  href: string
  ariaLabel?: string
}

export interface PillNavProps {
  logo: string
  logoAlt?: string
  items: PillNavItem[]
  activeHref?: string
  className?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  onMobileMenuClick?: () => void
  initialLoadAnimation?: boolean
}

const isExternalLink = (href: string) =>
  href.startsWith('http://') ||
  href.startsWith('https://') ||
  href.startsWith('//') ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:') ||
  href.startsWith('#')

export function PillNav({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  baseColor = '#fff',
  pillColor = '#060010',
  hoveredPillTextColor = '#060010',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
}: PillNavProps) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (initialLoadAnimation) {
      const t = setTimeout(() => setMounted(true), 20)
      return () => clearTimeout(t)
    }
    setMounted(true)
  }, [initialLoadAnimation])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(v => !v)
    onMobileMenuClick?.()
  }, [onMobileMenuClick])

  const cssVars = useMemo<CSSProperties>(
    () =>
      ({
        ['--pn-base' as string]: baseColor,
        ['--pn-pill-bg' as string]: pillColor,
        ['--pn-hover-text' as string]: hoveredPillTextColor,
        ['--pn-pill-text' as string]: resolvedPillTextColor,
        ['--pn-nav-h' as string]: '42px',
        ['--pn-pill-pad-x' as string]: '18px',
        ['--pn-pill-gap' as string]: '3px',
      }) as CSSProperties,
    [baseColor, pillColor, hoveredPillTextColor, resolvedPillTextColor]
  )

  const renderLink = (
    item: PillNavItem,
    children: React.ReactNode,
    extraProps: Record<string, unknown> = {}
  ) => {
    if (isExternalLink(item.href)) {
      return (
        <a href={item.href} aria-label={item.ariaLabel || item.label} {...extraProps}>
          {children}
        </a>
      )
    }
    return (
      <Link href={item.href} aria-label={item.ariaLabel || item.label} {...extraProps}>
        {children}
      </Link>
    )
  }

  return (
    <div
      className={`pointer-events-none absolute left-0 top-[1em] z-[1000] w-full md:left-auto md:w-auto ${className}`}
      style={cssVars}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto box-border flex w-full items-center justify-between px-4 md:w-max md:justify-start md:px-0"
      >
        <Link
          href="/"
          aria-label="Home"
          onMouseEnter={e => {
            const img = e.currentTarget.querySelector('img')
            if (img) {
              img.style.transition = 'transform 0.4s cubic-bezier(0.25,0.1,0.25,1)'
              img.style.transform = 'rotate(360deg)'
              setTimeout(() => {
                if (img) img.style.transform = 'rotate(0deg)'
              }, 450)
            }
          }}
          className="inline-flex items-center justify-center overflow-hidden rounded-full p-2"
          style={{
            width: 'var(--pn-nav-h)',
            height: 'var(--pn-nav-h)',
            background: 'var(--pn-base, #000)',
            transform: mounted ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.6s cubic-bezier(0.25,0.1,0.25,1)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={logoAlt} className="block h-full w-full object-cover" />
        </Link>

        <div
          className="relative ml-2 hidden items-center rounded-full md:flex"
          style={{
            height: 'var(--pn-nav-h)',
            background: 'var(--pn-base, #000)',
            width: mounted ? 'auto' : '0',
            overflow: mounted ? 'visible' : 'hidden',
            transition: 'width 0.6s cubic-bezier(0.25,0.1,0.25,1)',
          }}
        >
          <ul
            role="menubar"
            className="m-0 flex h-full list-none items-stretch p-[3px]"
            style={{ gap: 'var(--pn-pill-gap)' }}
          >
            {items.map((item, i) => (
              <li key={item.href || `item-${i}`} className="flex h-full" role="none">
                {renderLink(item, (
                  <>
                    <span className="pill-hover-circle" aria-hidden="true" />
                    <span className="relative z-[2] inline-block leading-[1]">
                      <span className="pill-label relative z-[2] inline-block leading-[1]">
                        {item.label}
                      </span>
                      <span
                        className="pill-label-hover absolute left-0 top-0 z-[3] inline-block"
                        style={{ color: 'var(--pn-hover-text, #fff)' }}
                        aria-hidden="true"
                      >
                        {item.label}
                      </span>
                    </span>
                    {activeHref === item.href && (
                      <span
                        className="absolute -bottom-[6px] left-1/2 z-[4] h-3 w-3 -translate-x-1/2 rounded-full"
                        style={{ background: 'var(--pn-base, #000)' }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                ), {
                  className:
                    'pill-item relative box-border inline-flex h-full cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-full text-[13px] font-semibold uppercase leading-[0] tracking-[0.15em] no-underline',
                  style: {
                    background: 'var(--pn-pill-bg, #fff)',
                    color: 'var(--pn-pill-text, var(--pn-base, #000))',
                    paddingLeft: 'var(--pn-pill-pad-x)',
                    paddingRight: 'var(--pn-pill-pad-x)',
                  } as CSSProperties,
                })}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-0 p-0 md:hidden"
          style={{
            width: 'var(--pn-nav-h)',
            height: 'var(--pn-nav-h)',
            background: 'var(--pn-base, #000)',
          }}
        >
          <span
            className="h-0.5 w-4 rounded"
            style={{
              background: 'var(--pn-pill-bg, #fff)',
              transform: isMobileMenuOpen ? 'rotate(45deg) translateY(3px)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.25,0.1,0.25,1)',
            }}
          />
          <span
            className="h-0.5 w-4 rounded"
            style={{
              background: 'var(--pn-pill-bg, #fff)',
              transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-3px)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.25,0.1,0.25,1)',
            }}
          />
        </button>
      </nav>

      <div
        className="pointer-events-auto absolute left-4 right-4 top-[3em] z-[998] origin-top rounded-[27px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] md:hidden"
        style={{
          background: 'var(--pn-base, #f0f0f0)',
          visibility: isMobileMenuOpen ? 'visible' : 'hidden',
          opacity: isMobileMenuOpen ? 1 : 0,
          transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease, visibility 0.25s',
        }}
      >
        <ul className="m-0 flex list-none flex-col gap-[3px] p-[3px]">
          {items.map(item => (
            <li key={item.href || `mobile-${item.label}`}>
              {renderLink(item, item.label, {
                className:
                  'mobile-pill-link block rounded-[50px] px-4 py-3 text-[14px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200',
                style: {
                  background: 'var(--pn-pill-bg, #fff)',
                  color: 'var(--pn-pill-text, #fff)',
                } as CSSProperties,
                onClick: () => setIsMobileMenuOpen(false),
              })}
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .pill-item {
          position: relative;
        }
        .pill-hover-circle {
          position: absolute;
          bottom: 0;
          left: 50%;
          z-index: 1;
          width: 300%;
          aspect-ratio: 1 / 1;
          border-radius: 9999px;
          background: var(--pn-base, #000);
          transform: translate(-50%, 100%) scale(0);
          transform-origin: 50% 0%;
          transition: transform 0.35s cubic-bezier(0.25,0.1,0.25,1);
          pointer-events: none;
        }
        .pill-item:hover .pill-hover-circle {
          transform: translate(-50%, 15%) scale(1.2);
        }
        .pill-label {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.25,0.1,0.25,1);
          will-change: transform;
        }
        .pill-label-hover {
          opacity: 0;
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.25,0.1,0.25,1), opacity 0.35s cubic-bezier(0.25,0.1,0.25,1);
          will-change: transform, opacity;
        }
        .pill-item:hover .pill-label {
          transform: translateY(-150%);
        }
        .pill-item:hover .pill-label-hover {
          opacity: 1;
          transform: translateY(0);
        }
        .mobile-pill-link:hover {
          background: var(--pn-base) !important;
          color: var(--pn-hover-text, #fff) !important;
        }
      `}</style>
    </div>
  )
}

export default PillNav
