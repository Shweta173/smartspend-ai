import { Link } from 'react-router-dom'
import { TrendingUp, Brain, BarChart3, Shield, Target, Zap, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    desc: 'Ask your AI assistant anything about your finances. Get personalized insights backed by your real data — not generic advice.',
    color: '#8B5CF6',
  },
  {
    icon: Zap,
    title: 'Smart Categorization',
    desc: 'Transactions auto-categorized the moment they come in — Swiggy → Food, Uber → Transport. Train it once and it learns.',
    color: '#F59E0B',
  },
  {
    icon: BarChart3,
    title: 'Beautiful Analytics',
    desc: '12-month trend charts, category breakdowns, and monthly comparisons. See where every rupee goes.',
    color: '#10B981',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    desc: 'Set savings goals with target dates. Get smart monthly savings suggestions to stay on track.',
    color: '#3B82F6',
  },
  {
    icon: Shield,
    title: 'Anomaly Detection',
    desc: 'Unusual transaction? SmartSpend flags it automatically so you catch suspicious charges before they add up.',
    color: '#EF4444',
  },
  {
    icon: TrendingUp,
    title: 'Budget Alerts',
    desc: "Set monthly category limits and get notified when you're approaching them. Never overspend again.",
    color: '#10B981',
  },
]

const INCLUDED = [
  'AI financial assistant',
  'Smart auto-categorization',
  'Anomaly detection',
  '12-month analytics',
  'Budget tracking',
  'Savings goals',
  'CSV import',
  'Multi-account support',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold">SmartSpend <span className="text-primary">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6">
            <Zap size={11} />
            Powered by Claude AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Your finances, finally
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
              making sense
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            SmartSpend AI is a premium financial workspace that tracks your money, spots patterns you'd miss, and answers your money questions instantly.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              Try the demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo credentials: demo@smartspend.ai / Demo@1234
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything you need to master your money</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Built with the same tools that power enterprise fintech — made simple for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="p-5 rounded-2xl border border-border bg-card hover:border-border/80 transition-all">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.color + '20' }}
                  >
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">One workspace, complete picture</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                No integrations to set up, no subscriptions to manage. Import your transactions via CSV, add them manually, or let the smart rules do the work.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {INCLUDED.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-primary shrink-0" />
                    <span className="text-xs text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                  <TrendingUp size={14} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium">Monthly savings rate</p>
                  <p className="text-lg font-bold text-green-500">28.4%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <div className="w-8 h-8 rounded-lg bg-violet-400/20 flex items-center justify-center">
                  <Brain size={14} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">AI Assistant</p>
                  <p className="text-xs text-foreground">"You spent ₹3,200 more on dining this month vs last month."</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="w-8 h-8 rounded-lg bg-red-400/20 flex items-center justify-center">
                  <Shield size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-400">Anomaly detected</p>
                  <p className="text-xs text-muted-foreground">₹8,999 — unusually high for Entertainment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Your financial workspace is ready. No credit card required — start with the demo account.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold">SmartSpend <span className="text-primary">AI</span></span>
          </div>
          <p className="text-xs text-muted-foreground">
            For educational purposes only — not professional financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
