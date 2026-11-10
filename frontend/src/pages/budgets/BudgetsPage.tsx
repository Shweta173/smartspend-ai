import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { budgetsApi, categoriesApi } from '@/services/api'
import { BudgetProgress } from '@/components/common/BudgetProgress'
import { toast } from '@/hooks/use-toast'
import { currentMonth } from '@/lib/utils'
import type { BudgetCreate } from '@/types'

export default function BudgetsPage() {
  const qc = useQueryClient()
  const [month, setMonth] = useState(currentMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BudgetCreate>({ month: currentMonth() + '-01', limit_amount: 0, alert_at_percent: 80 })

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => budgetsApi.list(month).then(r => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: BudgetCreate) => budgetsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      setShowForm(false)
      toast({ title: 'Budget created', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to create budget', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: 'Budget deleted', variant: 'success' })
    },
  })

  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Track spending against your monthly limits</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Add Budget
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-foreground">{budgets.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Budgets</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {budgets.filter(b => b.percent_used < 80).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">On Track</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-red-400">
            {budgets.filter(b => b.percent_used >= 100).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Exceeded</p>
        </div>
      </div>

      {/* Budget list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
        {!isLoading && budgets.length === 0 && (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            <p className="text-sm">No budgets for this month</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-primary hover:underline">
              Create your first budget →
            </button>
          </div>
        )}
        {budgets.map(budget => (
          <div key={budget.id} className="group relative">
            <BudgetProgress budget={budget} />
            <button
              onClick={() => deleteMutation.mutate(budget.id)}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add budget modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-card-lg animate-slide-up p-5 space-y-4">
            <h2 className="text-base font-semibold">Create Budget</h2>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
              <select
                value={form.category_id || ''}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category</option>
                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Monthly Limit (₹)</label>
              <input
                type="number" min="1"
                value={form.limit_amount || ''}
                onChange={e => setForm(f => ({ ...f, limit_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Month</label>
              <input
                type="month"
                value={form.month?.slice(0, 7) || month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value + '-01' }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >Cancel</button>
              <button
                onClick={() => createMutation.mutate({ ...form, month: (form.month?.slice(0, 7) || month) + '-01' })}
                disabled={createMutation.isPending || !form.limit_amount}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {createMutation.isPending ? 'Saving…' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
