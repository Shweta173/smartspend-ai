import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })

  const errors = {
    email: !email.trim()
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address'
      : '',
    password: !password ? 'Password is required' : '',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (errors.email || errors.password) return
    setServerError('')
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      await login(data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@smartspend.ai')
    setPassword('Demo@1234')
    setTouched({ email: false, password: false })
    setServerError('')
  }

  const field = (key: 'email' | 'password') =>
    touched[key] && errors[key]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-white">SmartSpend <span className="text-indigo-200">AI</span></span>
          </div>
          <div className="space-y-6 max-w-xs">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Your finances, finally making sense
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              AI-powered insights, smart categorization, and beautiful analytics — all in one premium financial workspace.
            </p>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '🧠', text: 'AI categorizes your transactions automatically' },
            { icon: '📊', text: 'Visual analytics with 12-month trend tracking' },
            { icon: '🎯', text: 'Goal tracking with smart savings suggestions' },
            { icon: '🔔', text: 'Anomaly detection for unusual spending' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-indigo-200">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-foreground">SmartSpend <span className="text-primary">AI</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your financial workspace</p>
          </div>

          <div className="mb-6 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
            <span className="font-medium">Try the demo:</span>{' '}
            <button onClick={fillDemo} className="underline underline-offset-2">
              Fill demo credentials
            </button>
            {' '}(demo@smartspend.ai / Demo@1234)
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="Your password"
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
