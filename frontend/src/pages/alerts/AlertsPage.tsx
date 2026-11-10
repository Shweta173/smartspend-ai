import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck, AlertTriangle, TrendingUp, Shield } from 'lucide-react'
import { alertsApi } from '@/services/api'
import type { Alert } from '@/types'
import { relativeTime, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const ALERT_ICONS: Record<string, React.ComponentType<any>> = {
  budget_exceeded: TrendingUp,
  budget_warning: TrendingUp,
  anomaly: Shield,
  goal_reached: CheckCheck,
  default: Bell,
}

const ALERT_COLORS: Record<string, string> = {
  budget_exceeded: '#EF4444',
  budget_warning: '#F59E0B',
  anomaly: '#EF4444',
  goal_reached: '#10B981',
  default: '#8B5CF6',
}

function AlertItem({ alert, onMarkRead }: { alert: Alert; onMarkRead: () => void }) {
  const Icon = ALERT_ICONS[alert.alert_type] || ALERT_ICONS.default
  const color = ALERT_COLORS[alert.alert_type] || ALERT_COLORS.default

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border transition-all',
        alert.is_read
          ? 'border-border/50 bg-card opacity-60'
          : 'border-border bg-card hover:border-primary/20',
      )}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + '20' }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-relaxed', alert.is_read ? 'text-muted-foreground' : 'text-foreground')}>
          {alert.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{relativeTime(alert.created_at)}</p>
      </div>
      {!alert.is_read && (
        <button
          onClick={onMarkRead}
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Mark as read"
        >
          <CheckCheck size={14} />
        </button>
      )}
      {!alert.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  )
}

export default function AlertsPage() {
  const qc = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list().then(r => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast({ title: 'All alerts marked as read', variant: 'success' }) },
  })

  const unread = alerts.filter(a => !a.is_read)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Budget warnings, anomalies, and goal updates</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-primary">{unread.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Unread</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-red-400">{alerts.filter(a => a.alert_type === 'anomaly').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Anomalies</p>
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}

        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-16">
            <BellOff size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No alerts — you're all caught up!</p>
          </div>
        )}

        {unread.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">Unread</h2>
            <div className="space-y-2">
              {unread.map(alert => (
                <AlertItem key={alert.id} alert={alert} onMarkRead={() => markReadMutation.mutate(alert.id)} />
              ))}
            </div>
          </div>
        )}

        {alerts.filter(a => a.is_read).length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">Earlier</h2>
            <div className="space-y-2">
              {alerts.filter(a => a.is_read).map(alert => (
                <AlertItem key={alert.id} alert={alert} onMarkRead={() => markReadMutation.mutate(alert.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
