import * as React from 'react'

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number
}

const BaseIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  ),
)
BaseIcon.displayName = 'BaseIcon'

// 📅 Calendar Icon
export const CalendarIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
))
CalendarIcon.displayName = 'CalendarIcon'

// 📱 Mobile Icon
export const MobileIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18.01" />
  </svg>
))
MobileIcon.displayName = 'MobileIcon'

// 🏆 Trophy Icon
export const TrophyIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M6 9H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2" />
    <path d="M6 9a6 6 0 0 1 12 0" />
    <line x1="9" y1="5" x2="15" y2="5" />
    <line x1="8" y1="5" x2="9" y2="9" />
    <line x1="16" y1="5" x2="15" y2="9" />
  </svg>
))
TrophyIcon.displayName = 'TrophyIcon'

// 🥋 Gi Icon (simplified as martial arts uniform)
export const GiIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M6 4h12v4l-2 2v10h-2v-6h-4v6h-2v-10l-2-2V4z" />
    <circle cx="12" cy="2" r="1.5" />
  </svg>
))
GiIcon.displayName = 'GiIcon'

// ⚡ Lightning/XP Icon
export const XpIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
))
XpIcon.displayName = 'XpIcon'

// 📊 Stats Icon
export const StatsIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
))
StatsIcon.displayName = 'StatsIcon'

// 🎯 Target/Check Icon
export const CheckIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
))
CheckIcon.displayName = 'CheckIcon'

// 👥 Users Icon
export const UsersIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
))
UsersIcon.displayName = 'UsersIcon'

// 💼 Briefcase Icon
export const BriefcaseIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
))
BriefcaseIcon.displayName = 'BriefcaseIcon'

// ⚙️ Settings Icon
export const SettingsIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.96 2.96l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m2.96-2.96l4.24-4.24" />
  </svg>
))
SettingsIcon.displayName = 'SettingsIcon'

// 🔒 Lock Icon
export const LockIcon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
))
LockIcon.displayName = 'LockIcon'
