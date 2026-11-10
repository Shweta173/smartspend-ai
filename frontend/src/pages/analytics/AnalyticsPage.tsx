import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { analyticsApi } from '@/services/api'
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { formatCurrency, formatMonthLabel, formatPercent, currentMonth } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ANALYTICS_KPIS = [
  { label: 'Income',       getValue: (s: any) => formatCurrency(s.total_income),  cls: 'text-green-600 dark:text-green-400' },
  { label: 'Expenses',     getValue: (s: any) => formatCurrency(s.total_expenses), cls: 'text-red-500' },
  { label: 'Net Savings',  getValue: (s: any) => formatCurrency(s.net_savings),   cls: 'text-violet-500' },
  { label: 'Savings Rate', getValue: (s: any) => formatPercent(s.savings_rate),   cls: 'text-amber-600 dark:text-amber-400' },
]

export default function AnalyticsPage() {
  const [month, setMonth] = useState(currentMonth())

  const { data: trend = [] } = useQuery({
    queryKey: ['trend', 12],
    queryFn: () => analyticsApi.monthly(12).then(r => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-breakdown', month],
    queryFn: () => analyticsApi.categories(month).then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => analyticsApi.summary(month).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep dive into your financial patterns</p>
        </div>
        <input
          type="month" value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ANALYTICS_KPIS.map((item, i) => (
          <div key={i} className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className={cn('text-2xl font-bold mt-1.5 tabular-nums', item.cls)}>
              {summary ? item.getValue(summary) : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* 12-month trend */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">12-Month Spending Trend</h3>
        <SpendingTrendChart data={trend} height={260} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Expense Categories — {formatMonthLabel(month)}
          </h3>
          <CategoryPieChart data={categories} height={240} />
        </div>

        {/* Bar chart */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Categories by Spend</h3>
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
              No data for selected month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categories.slice(0, 7)} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category_name" width={80}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Spent']}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {categories.slice(0, 7).map((entry, i) => (
                    <Cell key={i} fill={entry.category_color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Month comparisons table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Monthly Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Month', 'Income', 'Expenses', 'Savings', 'Rate'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {trend.slice().reverse().slice(0, 6).map((row, i) => (
                <tr key={i} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{formatMonthLabel(row.month)}</td>
                  <td className="px-5 py-3 text-green-600 dark:text-green-400 tabular-nums">{formatCurrency(row.income)}</td>
                  <td className="px-5 py-3 text-red-400 tabular-nums">{formatCurrency(row.expenses)}</td>
                  <td className="px-5 py-3 text-violet-400 tabular-nums">{formatCurrency(row.savings)}</td>
                  <td className="px-5 py-3 text-amber-400 tabular-nums">{formatPercent(row.savings_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
