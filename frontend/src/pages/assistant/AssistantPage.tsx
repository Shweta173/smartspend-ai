import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Bot, User, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { aiApi } from '@/services/api'
import type { ChatMessage } from '@/types'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'How much did I spend on food this month?',
  'What is my savings rate this month?',
  'Which category am I spending the most on?',
  'Compare this month with last month',
  'Am I on track to meet my savings goals?',
  'What are my top 3 expense categories?',
]

export default function AssistantPage() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load history
  const { isLoading: histLoading } = useQuery({
    queryKey: ['ai-history'],
    queryFn: () => aiApi.history().then(r => {
      setMessages(r.data)
      return r.data
    }),
    staleTime: 0,
  })

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiApi.chat(msg).then(r => r.data),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, created_at: new Date().toISOString() },
      ])
    },
    onError: () => toast({ title: 'Failed to get response', variant: 'destructive' }),
  })

  const clearMutation = useMutation({
    mutationFn: () => aiApi.clearHistory(),
    onSuccess: () => {
      setMessages([])
      toast({ title: 'Chat history cleared', variant: 'success' })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatMutation.isPending])

  const handleSend = (msg = input.trim()) => {
    if (!msg) return
    setMessages(prev => [
      ...prev,
      { role: 'user', content: msg, created_at: new Date().toISOString() },
    ])
    setInput('')
    chatMutation.mutate(msg)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </span>
            AI Financial Assistant
          </h1>
          <p className="page-subtitle">Ask anything about your finances — powered by AI</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <Trash2 size={13} />
            Clear history
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto stat-card p-4 space-y-4">
        {histLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot size={28} className="text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Ask about your finances</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-6">
              I can help you understand your spending, track goals, and provide personalized insights based on your actual financial data.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              For educational guidance only — not professional financial advice
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary',
              )}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted text-foreground rounded-tl-sm',
              )}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-soft"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (shown when empty) */}
      {messages.length === 0 && !histLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="text-left px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about your spending, goals, or budget…"
          disabled={chatMutation.isPending}
          className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || chatMutation.isPending}
          className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
