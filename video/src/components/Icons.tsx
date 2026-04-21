import React from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

const baseProps = (size: number, color: string, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const CalendarIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
  </svg>
)

export const SmartphoneIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
)

export const TrophyIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
)

export const GraduationCapIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)

export const ZapIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

export const ActivityIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

export const TargetIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

export const ClipboardIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6" />
  </svg>
)

export const MedalIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8" />
    <circle cx="12" cy="17" r="5" />
  </svg>
)

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export const FileTextIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

export const UsersIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const UserIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export const BriefcaseIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

export const PaletteIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <circle cx="13.5" cy="6.5" r=".5" fill={color} />
    <circle cx="17.5" cy="10.5" r=".5" fill={color} />
    <circle cx="8.5" cy="7.5" r=".5" fill={color} />
    <circle cx="6.5" cy="12.5" r=".5" fill={color} />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const BarChartIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
)

export const LockIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 48, color = 'currentColor', strokeWidth = 2 }) => (
  <svg {...baseProps(size, color, strokeWidth)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)
