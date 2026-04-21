import * as React from 'react'
import { cn } from '@/lib/utils'

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  as?: keyof JSX.IntrinsicElements
}

const GAP_MAP = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const ALIGN_MAP = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const JUSTIFY_MAP = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction = 'row',
      gap = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      as: Component = 'div',
      className,
      ...props
    },
    ref,
  ) => (
    <Component
      ref={ref as React.Ref<any>}
      className={cn(
        'flex',
        direction === 'col' ? 'flex-col' : 'flex-row',
        GAP_MAP[gap],
        ALIGN_MAP[align],
        JUSTIFY_MAP[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    />
  ),
)
Flex.displayName = 'Flex'

export { Flex }
