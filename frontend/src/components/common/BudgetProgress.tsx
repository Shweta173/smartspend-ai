import { cn, formatCurrency } from '@/lib/utils'
import type { Budget } from '@/types'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function DynIcon({ name, ...props }: { name: string } & React.ComponentProps<LucideIcon>) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
    name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')
  ] || LucideIcons.PiggyBank
  return <Icon {...props} />
}

interface Props {
  budget: Budget
  compact?: boolean
}

export function BudgetProgress({ budget, compact }: Props) {
  const pct = Math.min(budget.percent_used, 100)
  const isWarning = pct >= budget.alert_at_percent && pct < 100
  const isOver = pct >= 100

  const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'

  return (
    <div className={cn('space-y-2', compact ? '' : 'p-4 stat-card')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {budget.category_icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: (budget.category_color || '#94A3B8') + '20' }}
            >
              <DynIcon name={budget.category_icon} size={13} style={{ color: budget.category_color || '#94A3B8' }} />
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {budget.category_name || 'Overall Budget'}
          </span>
        </div>
        <span className={cn(
          'text-xs font-semibold tabular-nums',
          isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-muted-foreground'
        )}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(budget.spent_amount)} spent</span>
        <span>{formatCurrency(budget.limit_amount)} limit</span>
      </div>
    </div>
  )
}
