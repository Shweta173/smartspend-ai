import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { transactionsApi, categoriesApi, accountsApi } from '@/services/api'
import { TransactionRow } from '@/components/common/TransactionRow'
import { formatDate, cn, currentMonth } from '@/lib/utils'
import type { Transaction, TransactionCreate } from '@/types'
import { toast } from '@/hooks/use-toast'
import { TransactionModal } from './TransactionModal'

export default function TransactionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [txnType, setTxnType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search, month, txnType],
    queryFn: () => transactionsApi.list({
      page, page_size: 20, search: search || undefined,
      month: month || undefined, txn_type: txnType || undefined,
    }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Transaction deleted', variant: 'success' })
    },
  })

  const handleDelete = (txn: Transaction) => {
    if (confirm(`Delete "${txn.description}"?`)) {
      deleteMutation.mutate(txn.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            {data ? `${data.total} transactions` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search transactions…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={e => { setMonth(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={txnType}
          onChange={e => { setTxnType(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All types</option>
          <option value="debit">Expenses</option>
          <option value="credit">Income</option>
          <option value="transfer">Transfers</option>
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowLeftRight size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions found</p>
            <button
              onClick={() => { setEditing(null); setShowModal(true) }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Add your first transaction →
            </button>
          </div>
        ) : (
          <div>
            {data.items.map((txn, i) => (
              <div
                key={txn.id}
                className={cn('group relative', i > 0 && 'border-t border-border/50')}
              >
                <TransactionRow txn={txn} compact />
                {/* Row actions */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-card border border-border rounded-lg shadow-card px-1.5 py-1">
                  <button
                    onClick={() => { setEditing(txn); setShowModal(true) }}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(txn)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {data.page} of {data.total_pages} · {data.total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <TransactionModal
          transaction={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
          }}
        />
      )}
    </div>
  )
}

// Workaround import for the empty state icon
function ArrowLeftRight({ size, className }: { size: number; className: string }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
}
