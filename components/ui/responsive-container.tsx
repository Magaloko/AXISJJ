import * as React from 'react'
import { cn } from '@/lib/utils'
import { Flex } from './flex'

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  desktopLayout?: 'horizontal' | 'vertical'
  mobileLayout?: 'vertical' | 'horizontal'
  hideOnMobile?: boolean
  hideOnDesktop?: boolean
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ desktopLayout = 'horizontal', mobileLayout = 'vertical', hideOnMobile, hideOnDesktop, className, ...props }, ref) => (
    <Flex
      ref={ref}
      direction={desktopLayout === 'horizontal' ? 'row' : 'col'}
      className={cn(
        'md:flex-row md:items-stretch',
        mobileLayout === 'horizontal' ? 'flex-row' : 'flex-col',
        hideOnMobile && 'hidden md:flex',
        hideOnDesktop && 'md:hidden',
        className,
      )}
      {...props}
    />
  ),
)
ResponsiveContainer.displayName = 'ResponsiveContainer'

export { ResponsiveContainer }
