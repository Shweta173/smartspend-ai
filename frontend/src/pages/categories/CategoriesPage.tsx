import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { categoriesApi } from '@/services/api'
import type { Category } from '@/types'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PALETTE = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#22C55E', '#10B981', '#06B6D4', '#3B82F6',
  '#64748B', '#78716C',
]

function CategoryChip({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative flex items-center gap-2.5 px-3.5 py-2.5 bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-sm transition-all">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: cat.color + '20' }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
      </div>
      <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
      {cat.is_default && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
          Default
        </span>
      )}
      {!cat.is_default && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-sm px-1 py-0.5 z-10">
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<{ name: string; type: 'income' | 'expense'; color: string }>({
    name: '',
    type: 'expense',
    color: '#6366F1',
  })

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setShowModal(false)
      toast({ title: 'Category created', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to create category', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setShowModal(false)
      toast({ title: 'Category updated', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to update category', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Category deleted', variant: 'success' })
    },
    onError: () =>
      toast({ title: 'Cannot delete a category with transactions', variant: 'destructive' }),
  })

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', type: 'expense', color: '#6366F1' })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, type: cat.type, color: cat.color })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your transactions into meaningful groups</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-red-500">{expenseCategories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Expense</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{incomeCategories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Income</p>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Expense Categories</h2>
          <span className="ml-auto text-xs text-muted-foreground">{expenseCategories.length}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-11 rounded-xl" />
            ))}
          </div>
        ) : expenseCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No expense categories yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {expenseCategories.map(cat => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => {
                  if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Income Categories */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Income Categories</h2>
          <span className="ml-auto text-xs text-muted-foreground">{incomeCategories.length}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-11 rounded-xl" />
            ))}
          </div>
        ) : incomeCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No income categories yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {incomeCategories.map(cat => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => {
                  if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-card-lg animate-slide-up p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Food & Dining"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                      form.type === t
                        ? t === 'expense'
                          ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400'
                          : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                  >
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn(
                      'w-7 h-7 rounded-full transition-transform',
                      form.color === c
                        ? 'scale-125 ring-2 ring-offset-2 ring-offset-card ring-current'
                        : 'hover:scale-110',
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: form.color + '20' }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: form.color }} />
              </div>
              <span className="text-sm font-medium text-foreground">
                {form.name || 'Category preview'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
