import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, PiggyBank, BarChart3,
  ArrowRight, Sparkles, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { analyticsApi, aiApi, budgetsApi } from '@/services/api'
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { TransactionRow } from '@/components/common/TransactionRow'
import { BudgetProgress } from '@/components/common/BudgetProgress'
import { formatCurrency, formatPercent, currentMonth, formatMonthLabel } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const [month] = useState(currentMonth())

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => analyticsApi.dashboard(month).then(r => r.data),
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => budgetsApi.list(month).then(r => r.data),
  })

  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['insights', month],
    queryFn: () => aiApi.insights(month).then(r => r.data),
    staleTime: 1000 * 60 * 10,
  })

  const trend = dashboard?.monthly_trend || []
  const prevMonth = trend.length >= 2 ? trend[trend.length - 2] : null
  const thisMonth = trend.length >= 1 ? trend[trend.length - 1] : null

  const expenseChange = prevMonth && thisMonth
    ? ((thisMonth.expenses - prevMonth.expenses) / (prevMonth.expenses || 1)) * 100
    : undefined

  const incomeChange = prevMonth && thisMonth
    ? ((thisMonth.income - prevMonth.income) / (prevMonth.income || 1)) * 100
    : undefined

  return (
    <div className="space-y-5">

      {/* Hero Balance Card */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-6 overflow-hidden shadow-lg">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-4 right-24 w-20 h-20 rounded-full bg-violet-400/10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Total Balance</p>
              {isLoading ? (
                <div className="h-9 w-40 rounded-lg bg-white/10 animate-pulse mt-1" />
              ) : (
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                  {formatCurrency(dashboard?.total_balance || 0)}
                </p>
              )}
              <p className="text-indigo-300 text-xs mt-1.5">{formatMonthLabel(month)}</p>
            </div>
            <div className="mt-1">
              {dashboard?.anomaly_count ? (
                <Link
                  to="/alerts"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-200 text-xs border border-amber-400/30 hover:bg-amber-400/30 transition-colors"
                >
                  <AlertTriangle size={11} />
                  {dashboard.anomaly_count} alert{dashboard.anomaly_count !== 1 ? 's' : ''}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/15 text-green-200 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  All clear
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-green-400/30 flex items-center justify-center">
                  <TrendingUp size={9} className="text-green-300" />
                </div>
                <span className="text-xs text-indigo-200">Income</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
              ) : (
                <p className="font-semibold text-white tabular-nums">
                  {formatCurrency(dashboard?.total_income || 0)}
                </p>
              )}
              {incomeChange !== undefined && (
                <p className={`text-[11px] mt-0.5 ${incomeChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% vs last month
                </p>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-red-400/30 flex items-center justify-center">
                  <TrendingDown size={9} className="text-red-300" />
                </div>
                <span className="text-xs text-indigo-200">Expenses</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
              ) : (
                <p className="font-semibold text-white tabular-nums">
                  {formatCurrency(dashboard?.total_expenses || 0)}
                </p>
              )}
              {expenseChange !== undefined && (
                <p className={`text-[11px] mt-0.5 ${expenseChange <= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs last month
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Savings</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <PiggyBank size={17} className="text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-32 rounded-lg bg-blue-200/50 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 tabular-nums">
              {formatCurrency(dashboard?.net_savings || 0)}
            </p>
          )}
          {dashboard?.savings_rate !== undefined && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1.5 flex items-center gap-1">
              <TrendingUp size={10} />
              {formatPercent(dashboard.savings_rate)} savings rate
            </p>
          )}
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/20 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Avg Daily Spend</span>
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <BarChart3 size={17} className="text-violet-500 dark:text-violet-400" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-7 w-32 rounded-lg bg-violet-200/50 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-violet-800 dark:text-violet-200 tabular-nums">
              {formatCurrency(Math.round((dashboard?.total_expenses || 0) / 30))}
            </p>
          )}
          <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5">per day this month</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Spending Trend</h3>
              <p className="text-xs text-muted-foreground">6-month overview</p>
            </div>
          </div>
          {isLoading ? (
            <div className="skeleton h-[200px] w-full" />
          ) : (
            <SpendingTrendChart data={dashboard?.monthly_trend || []} />
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Category Breakdown</h3>
            <p className="text-xs text-muted-foreground">This month's expenses</p>
          </div>
          {isLoading ? (
            <div className="skeleton h-[200px] w-full" />
          ) : (
            <CategoryPieChart data={dashboard?.top_categories || []} />
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 my-1 rounded-xl" />
                ))
              : dashboard?.recent_transactions?.map((txn, i) => (
                  <TransactionRow key={i} txn={txn} compact />
                ))
            }
            {!isLoading && !dashboard?.recent_transactions?.length && (
              <p className="text-xs text-muted-foreground text-center py-8">No transactions yet.</p>
            )}
          </div>
        </div>

        {/* Budget Status */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Budget Status</h3>
            <Link to="/budgets" className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.length === 0 && !isLoading && (
              <div className="text-xs text-muted-foreground text-center py-8">
                <PiggyBank size={28} className="mx-auto mb-2 opacity-30" />
                <p>No budgets for this month</p>
                <Link to="/budgets" className="text-primary hover:underline mt-1 inline-block">
                  Set budgets →
                </Link>
              </div>
            )}
            {budgets.slice(0, 5).map(b => (
              <BudgetProgress key={b.id} budget={b} compact />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles size={13} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
            </div>
            <button
              onClick={() => refetchInsights()}
              disabled={insightsLoading}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={12} className={insightsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {insightsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(insights?.insights || []).map((insight, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
              {!insights?.insights?.length && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Add transactions to see personalized insights.
                </p>
              )}
            </div>
          )}

          <Link
            to="/assistant"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles size={12} />
            Ask AI Assistant
          </Link>
        </div>

      </div>
    </div>
  )
}
