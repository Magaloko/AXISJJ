import * as React from 'react'
import { cn } from '@/lib/utils'

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ as: Component = 'div', className, ...props }, ref) => (
    <Component ref={ref as React.Ref<any>} className={className} {...props} />
  ),
)
Box.displayName = 'Box'

export { Box }
