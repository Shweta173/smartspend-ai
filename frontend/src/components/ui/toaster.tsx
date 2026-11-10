import { useToast } from '@/hooks/use-toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-card-lg bg-card text-card-foreground animate-slide-up',
            toast.variant === 'destructive' && 'border-destructive/30 bg-destructive/10',
            toast.variant === 'success'     && 'border-primary/30 bg-primary/10',
          )}
        >
          {toast.variant === 'success'     && <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />}
          {toast.variant === 'destructive' && <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />}
          {(!toast.variant || toast.variant === 'default') && <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            {toast.title    && <p className="text-sm font-medium">{toast.title}</p>}
            {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="p-0.5 rounded hover:bg-accent text-muted-foreground">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
