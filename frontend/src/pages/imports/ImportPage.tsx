import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Upload, FileText, CheckCircle2, XCircle, ChevronRight, AlertTriangle, Download } from 'lucide-react'
import { accountsApi } from '@/services/api'
import { apiClient } from '@/services/api/client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'preview' | 'done'

interface PreviewRow {
  row: number
  txn_date: string
  description: string
  amount: number
  txn_type: string
  category?: string
  error?: string
}

interface ImportResult {
  import_id: number
  total_rows: number
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState<number | ''>('')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.csv')) { setError('Please upload a CSV file'); return }
    setError('')
    setFile(f)
  }

  const handlePreview = async () => {
    if (!file || !accountId) { setError('Please select a file and account'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('account_id', String(accountId))
      fd.append('preview_only', 'true')
      const { data } = await apiClient.post('/imports/preview', fd)
      setPreview(data.rows || [])
      setStep('preview')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file || !accountId) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('account_id', String(accountId))
      const { data } = await apiClient.post('/imports/', fd)
      setResult(data)
      setStep('done')
      toast({ title: `Imported ${data.imported} transactions`, variant: 'success' })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setAccountId('')
    setPreview([])
    setResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const STEPS = ['upload', 'preview', 'done']

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="page-title">Import Transactions</h1>
        <p className="page-subtitle">Upload a CSV file to bulk-import transactions</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['Upload', 'Preview', 'Done'] as const).map((label, i) => {
          const idx = STEPS.indexOf(step)
          const isActive = i === idx
          const isDone = i < idx
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                isActive ? 'bg-primary text-primary-foreground' :
                isDone   ? 'bg-green-500/15 text-green-500' :
                           'bg-muted text-muted-foreground',
              )}>
                {isDone ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
              {i < 2 && <ChevronRight size={14} className="text-muted-foreground/40" />}
            </div>
          )
        })}
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div className="stat-card space-y-5">
          {/* CSV format hint */}
          <div className="p-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Expected CSV format:</p>
            <code className="font-mono">date, description, amount, type (debit/credit)</code>
            <p className="mt-1 text-muted-foreground/70">Columns can be in any order. First row should be headers.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account</label>
            <select
              value={accountId}
              onChange={e => setAccountId(Number(e.target.value) || '')}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select account…</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CSV File</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors',
                file ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50',
              )}
            >
              {file ? (
                <>
                  <FileText size={28} className="text-primary" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Drop your CSV here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

          <button
            onClick={handlePreview}
            disabled={loading || !file || !accountId}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Parsing…' : 'Preview Import'}
          </button>
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && (
        <div className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{preview.length} rows found</h2>
            <button onClick={() => setStep('upload')} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr>
                  {['Row', 'Date', 'Description', 'Amount', 'Type', 'Category', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className={cn('transition-colors', row.error ? 'bg-destructive/5' : 'hover:bg-accent/30')}>
                    <td className="px-3 py-2 text-muted-foreground">{row.row}</td>
                    <td className="px-3 py-2">{row.txn_date}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate">{row.description}</td>
                    <td className="px-3 py-2 tabular-nums">₹{row.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 capitalize">{row.txn_type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.category || '—'}</td>
                    <td className="px-3 py-2">
                      {row.error
                        ? <span className="text-destructive flex items-center gap-1"><XCircle size={11} /> {row.error}</span>
                        : <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={11} /> OK</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 20 && (
            <p className="text-xs text-muted-foreground text-center">Showing first 20 of {preview.length} rows</p>
          )}

          {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Importing…' : `Import ${preview.filter(r => !r.error).length} Transactions`}
            </button>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === 'done' && result && (
        <div className="stat-card text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Import Complete</h2>
            <p className="text-sm text-muted-foreground mt-1">Your transactions have been imported and categorized</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-xl font-bold text-foreground">{result.total_rows}</p>
              <p className="text-xs text-muted-foreground">Total rows</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10">
              <p className="text-xl font-bold text-red-400">{result.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="text-left p-3 rounded-xl bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Failed rows
              </p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-muted-foreground">Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}

          <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Import Another File
          </button>
        </div>
      )}
    </div>
  )
}
