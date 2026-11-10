import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, CreditCard, Wallet, PiggyBank, Building2 } from 'lucide-react'
import { accountsApi } from '@/services/api'
import type { Account, AccountCreate, AccountType } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const ACCOUNT_ICONS: Record<string, React.ComponentType<any>> = {
  savings: Building2,
  current: Building2,
  cash: Wallet,
  credit_card: CreditCard,
  wallet: Wallet,
  investment: PiggyBank,
  other: Wallet,
}

const ACCOUNT_TYPES: AccountType[] = ['savings', 'current', 'cash', 'credit_card', 'wallet', 'investment', 'other']
const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#F97316', '#06B6D4']

export default function AccountsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState<AccountCreate>({ name: '', account_type: 'savings', currency: 'INR', color: '#10B981' })

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: AccountCreate) => accountsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowModal(false); toast({ title: 'Account created', variant: 'success' }) },
    onError: () => toast({ title: 'Failed to create account', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountCreate> }) => accountsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowModal(false); toast({ title: 'Account updated', variant: 'success' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast({ title: 'Account deleted', variant: 'success' }) },
  })

  const totalBalance = accounts.reduce((s, a) => a.account_type === 'credit_card' ? s - a.balance : s + a.balance, 0)

  const openEdit = (acc: Account) => {
    setEditing(acc)
    setForm({ name: acc.name, account_type: acc.account_type, currency: acc.currency, color: acc.color, icon: acc.icon })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form })
    else createMutation.mutate(form)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', account_type: 'savings', currency: 'INR', color: '#10B981' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {/* Net worth */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <p className="text-indigo-200 text-sm font-medium mb-1">Net Balance</p>
        <p className={cn('text-3xl font-bold tabular-nums', totalBalance >= 0 ? 'text-white' : 'text-red-200')}>
          {formatCurrency(totalBalance)}
        </p>
        <p className="text-indigo-200 text-sm mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        {accounts.map(acc => {
          const Icon = ACCOUNT_ICONS[acc.account_type] || Wallet
          const isCredit = acc.account_type === 'credit_card'
          return (
            <div key={acc.id} className="stat-card group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: acc.color + '20' }}>
                    <Icon size={18} style={{ color: acc.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{acc.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{acc.account_type}</p>
                  </div>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground">
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => confirm(`Delete "${acc.name}"?`) && deleteMutation.mutate(acc.id)}
                    className="p-1.5 rounded-lg bg-card border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className={cn('text-2xl font-bold tabular-nums', isCredit ? 'text-red-400' : 'text-foreground')}>
                {isCredit ? '−' : ''}{formatCurrency(acc.balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{acc.currency}</p>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-card-lg animate-slide-up p-5 space-y-4">
            <h2 className="text-base font-semibold">{editing ? 'Edit Account' : 'New Account'}</h2>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account Name</label>
              <input
                type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. HDFC Savings"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account Type</label>
              <select
                value={form.account_type}
                onChange={e => setForm(f => ({ ...f, account_type: e.target.value as AccountType }))}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn('w-7 h-7 rounded-full transition-transform', form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-card ring-current' : 'hover:scale-110')}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !form.name}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
