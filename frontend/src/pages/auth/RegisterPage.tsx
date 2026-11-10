import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, ArrowRight, Loader2, Check } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [touched, setTouched] = useState({ full_name: false, email: false, password: false })

  const errors = {
    full_name: !form.full_name.trim() ? 'Full name is required' : '',
    email: !form.email.trim()
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : '',
    password: !form.password
      ? 'Password is required'
      : form.password.length < 8
      ? 'Password must be at least 8 characters'
      : !/[A-Z]/.test(form.password)
      ? 'Password must contain at least one uppercase letter'
      : !/\d/.test(form.password)
      ? 'Password must contain at least one number'
      : '',
  }

  const pwChecks = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'One number', ok: /\d/.test(form.password) },
  ]

  const field = (key: keyof typeof touched) => touched[key] && errors[key]

  const handleBlur = (key: keyof typeof touched) =>
    setTouched(t => ({ ...t, [key]: true }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ full_name: true, email: true, password: true })
    if (errors.full_name || errors.email || errors.password) return
    setServerError('')
    setLoading(true)
    try {
      await authApi.register(form)
      const { data } = await authApi.login({ email: form.email, password: form.password })
      await login(data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-foreground">SmartSpend <span className="text-primary">AI</span></span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing your finances intelligently</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              onBlur={() => handleBlur('full_name')}
              placeholder="Priya Sharma"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
                field('full_name')
                  ? 'border-destructive focus:ring-destructive/30'
                  : 'border-border focus:ring-ring',
              )}
            />
            {field('full_name') && (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-destructive text-white text-center leading-3.5 font-bold shrink-0">!</span>
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
                field('email')
                  ? 'border-destructive focus:ring-destructive/30'
                  : 'border-border focus:ring-ring',
              )}
            />
            {field('email') && (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-destructive text-white text-center leading-3.5 font-bold shrink-0">!</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onBlur={() => handleBlur('password')}
                placeholder="Create a strong password"
                className={cn(
                  'w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
                  field('password')
                    ? 'border-destructive focus:ring-destructive/30'
                    : 'border-border focus:ring-ring',
                )}
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {field('password') && (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-destructive text-white text-center leading-3.5 font-bold shrink-0">!</span>
                {errors.password}
              </p>
            )}
            {/* Live password strength checklist */}
            {form.password && (
              <div className="mt-2.5 space-y-1">
                {pwChecks.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check
                      size={11}
                      className={c.ok ? 'text-green-500' : 'text-muted-foreground/40'}
                    />
                    <span className={`text-xs ${c.ok ? 'text-green-500' : 'text-muted-foreground/60'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg">
              {serverError}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create Account <ArrowRight size={15} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
