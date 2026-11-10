import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Target, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { goalsApi } from '@/services/api'
import type { Goal, GoalCreate } from '@/types'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const pct = Math.min(goal.progress_percent, 100)
  return (
    <div className="stat-card group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: goal.color + '20' }}
          >
            <Target size={18} style={{ color: goal.color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{goal.name}</h3>
            {goal.target_date && (
              <p className="text-xs text-muted-foreground">Target: {formatDate(goal.target_date, 'medium')}</p>
            )}
          </div>
        </div>
        {goal.is_completed && (
          <span className="badge-income gap-1">
            <CheckCircle2 size={10} />
            Completed
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{formatCurrency(goal.current_amount)}</span>
          <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: goal.color }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-muted-foreground">of {formatCurrency(goal.target_amount)}</span>
          <span className="text-muted-foreground">{formatCurrency(goal.remaining_amount)} left</span>
        </div>
      </div>

      {goal.suggested_monthly && !goal.is_completed && (
        <div className="p-2.5 rounded-lg bg-muted text-xs text-muted-foreground">
          Suggested monthly: <span className="text-foreground font-medium">{formatCurrency(goal.suggested_monthly)}</span>
          {goal.months_to_goal && ` over ${goal.months_to_goal.toFixed(1)} months`}
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1">
        <button onClick={onEdit} className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground">
          <Pencil size={12} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg bg-card border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalCreate>({ name: '', target_amount: 0, color: '#8B5CF6' })

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: GoalCreate) => goalsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setShowModal(false); toast({ title: 'Goal created', variant: 'success' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GoalCreate> }) => goalsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setShowModal(false); toast({ title: 'Goal updated', variant: 'success' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast({ title: 'Goal deleted', variant: 'success' }) },
  })

  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form })
    else createMutation.mutate(form)
  }

  const openEdit = (goal: Goal) => {
    setEditing(goal)
    setForm({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date || undefined,
      color: goal.color,
    })
    setShowModal(true)
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved  = goals.reduce((s, g) => s + g.current_amount, 0)
  const completed   = goals.filter(g => g.is_completed).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track your progress toward financial milestones</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', target_amount: 0, color: '#8B5CF6' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-violet-400">{goals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Goals</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSaved)}</p>
          <p className="text-xs text-muted-foreground mt-1">Saved of {formatCurrency(totalTarget)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        {!isLoading && goals.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Target size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No goals yet — set one to get started</p>
          </div>
        )}
        {goals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={() => openEdit(goal)}
            onDelete={() => confirm(`Delete goal "${goal.name}"?`) && deleteMutation.mutate(goal.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-card-lg animate-slide-up p-5 space-y-4">
            <h2 className="text-base font-semibold">{editing ? 'Edit Goal' : 'New Savings Goal'}</h2>

            {[
              { label: 'Goal Name', key: 'name', type: 'text', placeholder: 'e.g. Emergency Fund' },
              { label: 'Target Amount (₹)', key: 'target_amount', type: 'number', placeholder: '100000' },
              { label: 'Current Amount (₹)', key: 'current_amount', type: 'number', placeholder: '0' },
              { label: 'Target Date', key: 'target_date', type: 'date', placeholder: '' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
                <input
                  type={field.type}
                  value={(form as any)[field.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
              <div className="flex gap-2">
                {['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#F97316'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn('w-7 h-7 rounded-full transition-transform', form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-card ring-current' : 'hover:scale-110')}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !form.name || !form.target_amount}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
