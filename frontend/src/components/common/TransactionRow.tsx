import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Transaction } from '@/types'
import { AlertTriangle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function DynIcon({ name, ...props }: { name: string } & React.ComponentProps<LucideIcon>) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
    name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')
  ] || LucideIcons.Circle
  return <Icon {...props} />
}

interface Props {
  txn: Transaction | Partial<Transaction>
  onClick?: () => void
  compact?: boolean
}

export function TransactionRow({ txn, onClick, compact }: Props) {
  const isDebit = txn.txn_type === 'debit'
  const isCredit = txn.txn_type === 'credit'

  return (
    <div
      className={cn(
        'flex items-center gap-3 hover:bg-accent/50 transition-colors rounded-lg cursor-default',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: (txn.category_color || '#94A3B8') + '20' }}
      >
        <DynIcon
          name={txn.category_icon || 'circle-dot'}
          size={16}
          style={{ color: txn.category_color || '#94A3B8' }}
        />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {txn.merchant && (
            <span className="text-xs text-muted-foreground truncate">{txn.merchant}</span>
          )}
          {txn.txn_date && (
            <span className="text-xs text-muted-foreground">· {formatDate(txn.txn_date)}</span>
          )}
          {txn.is_anomaly && (
            <span className="badge-anomaly gap-1 ml-1">
              <AlertTriangle size={9} />
              Unusual
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={cn(
          'text-sm font-semibold tabular-nums',
          isDebit  ? 'text-red-400' : '',
          isCredit ? 'text-green-600 dark:text-green-400' : '',
          txn.txn_type === 'transfer' ? 'text-blue-400' : '',
        )}>
          {isDebit ? '−' : isCredit ? '+' : '↔ '}
          {formatCurrency(txn.amount || 0)}
        </p>
        {txn.category_name && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{txn.category_name}</p>
        )}
      </div>
    </div>
  )
}
