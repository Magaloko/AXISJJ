import * as React from 'react'
import { cn } from '@/lib/utils'
import { Flex } from './flex'

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  title: string
  description: string
  variant?: 'default' | 'minimal'
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, variant = 'default', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card p-6 transition-all hover:shadow-md',
        variant === 'default' && 'border-border shadow-sm',
        variant === 'minimal' && 'border-transparent bg-muted/50',
        className,
      )}
      {...props}
    >
      <Flex direction="col" gap="md">
        <div className="text-primary">{icon}</div>
        <Flex direction="col" gap="xs">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </Flex>
      </Flex>
    </div>
  ),
)
FeatureCard.displayName = 'FeatureCard'

export { FeatureCard }
