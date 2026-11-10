import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

let globalToasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notify() {
  listeners.forEach(l => l([...globalToasts]))
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  globalToasts = [...globalToasts, { ...options, id }]
  notify()
  setTimeout(() => {
    globalToasts = globalToasts.filter(t => t.id !== id)
    notify()
  }, 4000)
  return id
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const subscribe = useCallback(() => {
    const handler = (ts: Toast[]) => setToasts(ts)
    listeners.push(handler)
    setToasts([...globalToasts])
    return () => { listeners = listeners.filter(l => l !== handler) }
  }, [])

  // Auto-subscribe
  useState(() => { return subscribe() })

  const dismiss = (id: string) => {
    globalToasts = globalToasts.filter(t => t.id !== id)
    notify()
  }

  return { toasts, dismiss }
}
