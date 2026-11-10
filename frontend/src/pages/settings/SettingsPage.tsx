import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Moon, Sun, User, Lock, Globe } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="stat-card space-y-4">
      <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', currency: user?.currency || 'INR' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )

  const profileMutation = useMutation({
    mutationFn: (data: typeof profile) => authApi.updateMe(data),
    onSuccess: () => { refreshUser(); toast({ title: 'Profile updated', variant: 'success' }) },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  })

  const pwMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => authApi.changePassword(data),
    onSuccess: () => { setPwForm({ current_password: '', new_password: '', confirm: '' }); toast({ title: 'Password changed', variant: 'success' }) },
    onError: (err: any) => toast({ title: err.response?.data?.detail || 'Failed to change password', variant: 'destructive' }),
  })

  const toggleTheme = (t: 'dark' | 'light') => {
    setTheme(t)
    if (t === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('ss_theme', t)
  }

  const handlePwSubmit = () => {
    if (pwForm.new_password !== pwForm.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (pwForm.new_password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    pwMutation.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
            <input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Currency</label>
            <select
              value={profile.currency}
              onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => profileMutation.mutate(profile)}
          disabled={profileMutation.isPending}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </Section>

      <Section title="Appearance">
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => toggleTheme(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                theme === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {t === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Change Password">
        <div className="space-y-3">
          {[
            { label: 'Current Password', key: 'current_password' },
            { label: 'New Password', key: 'new_password' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
              <input
                type="password"
                value={(pwForm as any)[field.key]}
                onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handlePwSubmit}
          disabled={pwMutation.isPending || !pwForm.current_password || !pwForm.new_password}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pwMutation.isPending ? 'Updating…' : 'Change Password'}
        </button>
      </Section>

      <Section title="About">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>SmartSpend AI — Personal Finance Platform</p>
          <p>Built with FastAPI, React, and Claude AI</p>
          <p className="italic">For educational purposes only — not professional financial advice.</p>
        </div>
      </Section>
    </div>
  )
}
