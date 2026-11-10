import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, Calendar, DollarSign } from 'lucide-react'
import { transactionsApi, categoriesApi, accountsApi } from '@/services/api'
import type { Transaction, TransactionCreate } from '@/types'
import { toast } from '@/hooks/use-toast'
import { currentMonth } from '@/lib/utils'

interface Props {
  transaction: Transaction | null
  onClose: () => void
  onSaved: () => void
}

export function TransactionModal({ transaction, onClose, onSaved }: Props) {
  const [form, setForm] = useState<TransactionCreate>({
    txn_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    txn_type: 'debit',
    merchant: '',
    notes: '',
  })

  useEffect(() => {
    if (transaction) {
      setForm({
        txn_date: transaction.txn_date,
        description: transaction.description,
        amount: transaction.amount,
        txn_type: transaction.txn_type,
        merchant: transaction.merchant || '',
        notes: transaction.notes || '',
        category_id: transaction.category_id ?? undefined,
        account_id: transaction.account_id ?? undefined,
      })
    }
  }, [transaction])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.create(data),
    onSuccess: () => { toast({ title: 'Transaction added', variant: 'success' }); onSaved() },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.update(transaction!.id, data),
    onSuccess: () => { toast({ title: 'Transaction updated', variant: 'success' }); onSaved() },
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.amount) return
    if (transaction) updateMutation.mutate(form)
    else createMutation.mutate(form)
  }

  const filteredCats = categories.filter(c =>
    form.txn_type === 'credit' ? c.type === 'income' : c.type === 'expense'
  )

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-card-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {(['debit', 'credit', 'transfer'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, txn_type: type }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  form.txn_type === type
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type === 'debit' ? 'Expense' : type === 'credit' ? 'Income' : 'Transfer'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount (₹)</label>
            <input
              type="number" step="0.01" min="0.01" required
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description + Merchant */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description *</label>
              <input
                required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What was this for?"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Merchant</label>
              <input
                value={form.merchant || ''}
                onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))}
                placeholder="e.g. Swiggy"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
              <input
                type="date" required value={form.txn_date}
                onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category + Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
              <select
                value={form.category_id || ''}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Auto-detect</option>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account</label>
              <select
                value={form.account_id || ''}
                onChange={e => setForm(f => ({ ...f, account_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Saving…' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
