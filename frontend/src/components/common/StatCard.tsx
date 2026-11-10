import { type LucideIcon } from 'lucide-react'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  currency?: boolean
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  change?: number
  changeLabel?: string
  variant?: 'default' | 'income' | 'expense' | 'savings' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const VARIANT_STYLES = {
  default:  { icon: 'bg-primary/10 text-primary',      value: 'text-foreground' },
  income:   { icon: 'bg-green-500/10 text-green-500', value: 'text-green-600 dark:text-green-400' },
  expense:  { icon: 'bg-red-500/10 text-red-400',       value: 'text-red-400' },
  savings:  { icon: 'bg-violet-500/10 text-violet-400',  value: 'text-violet-400' },
  neutral:  { icon: 'bg-muted text-muted-foreground',   value: 'text-foreground' },
}

export function StatCard({
  title, value, currency = true, icon: Icon,
  change, changeLabel, variant = 'default', size = 'md', className,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className={cn(
            'font-bold tabular-nums mt-1.5',
            size === 'md' ? 'text-2xl' : 'text-xl',
            styles.value
          )}>
            {currency ? formatCurrency(value) : value.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl', styles.icon)}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {change >= 0 ? (
            <TrendingUp size={12} className="text-green-500" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span className={cn('text-xs font-medium', change >= 0 ? 'text-green-500' : 'text-red-400')}>
            {change >= 0 ? '+' : ''}{formatPercent(Math.abs(change), 1)}
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
