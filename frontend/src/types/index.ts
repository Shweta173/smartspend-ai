// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  full_name: string
  currency: string
  theme: string
  avatar_url: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// ── Account ───────────────────────────────────────────────────────────────────
export type AccountType = 'savings' | 'current' | 'cash' | 'credit_card' | 'wallet' | 'investment' | 'other'

export interface Account {
  id: number
  name: string
  account_type: AccountType
  currency: string
  balance: number
  color: string
  icon: string
  is_active: boolean
  include_in_total: boolean
  notes: string | null
  created_at: string
}

export interface AccountCreate {
  name: string
  account_type: AccountType
  currency?: string
  balance?: number
  color?: string
  icon?: string
  notes?: string
  include_in_total?: boolean
}

export type AccountUpdate = Partial<AccountCreate> & { is_active?: boolean }

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  is_default: boolean
  parent_id: number | null
}

// ── Transaction ───────────────────────────────────────────────────────────────
export type TxnType = 'debit' | 'credit' | 'transfer'

export interface Transaction {
  id: number
  account_id: number | null
  category_id: number | null
  txn_date: string
  description: string
  merchant: string | null
  amount: number
  txn_type: TxnType
  notes: string | null
  category_source: string
  is_anomaly: boolean
  anomaly_score: number | null
  anomaly_reason: string | null
  created_at: string
  category_name?: string
  category_color?: string
  category_icon?: string
  account_name?: string
}

export interface TransactionCreate {
  account_id?: number
  category_id?: number
  txn_date: string
  description: string
  merchant?: string
  amount: number
  txn_type: TxnType
  to_account_id?: number
  notes?: string
}

export type TransactionUpdate = Partial<TransactionCreate>

export interface TransactionListResponse {
  items: Transaction[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ── Budget ────────────────────────────────────────────────────────────────────
export interface Budget {
  id: number
  category_id: number | null
  month: string
  limit_amount: number
  alert_at_percent: number
  is_active: boolean
  spent_amount: number
  remaining_amount: number
  percent_used: number
  category_name?: string
  category_color?: string
  category_icon?: string
}

export interface BudgetCreate {
  category_id?: number
  month: string
  limit_amount: number
  alert_at_percent?: number
}

export type BudgetUpdate = Partial<Omit<BudgetCreate, 'month'>> & { is_active?: boolean }

// ── Goal ──────────────────────────────────────────────────────────────────────
export interface Goal {
  id: number
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  icon: string
  color: string
  is_completed: boolean
  progress_percent: number
  remaining_amount: number
  months_to_goal: number | null
  suggested_monthly: number | null
  created_at: string
}

export interface GoalCreate {
  name: string
  description?: string
  target_amount: number
  current_amount?: number
  target_date?: string
  icon?: string
  color?: string
}

export type GoalUpdate = Partial<GoalCreate> & { is_completed?: boolean }

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  month: string
  total_income: number
  total_expenses: number
  net_savings: number
  savings_rate: number
  total_balance: number
  top_categories: CategoryBreakdown[]
  monthly_trend: MonthlyTrend[]
  budget_utilization: Budget[]
  recent_transactions: Partial<Transaction>[]
  anomaly_count: number
  unread_alerts: number
}

export interface CategoryBreakdown {
  category_id: number | null
  category_name: string
  category_color: string
  category_icon: string
  total: number
  count: number
  percent: number
}

export interface MonthlyTrend {
  month: string
  income: number
  expenses: number
  savings: number
  savings_rate: number
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export interface Alert {
  id: number
  alert_type: string
  message: string
  is_read: boolean
  transaction_id: number | null
  created_at: string
}

// ── AI ────────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface ChatResponse {
  reply: string
  context_month: string
  context_summary: Record<string, unknown>
}

export interface InsightsResponse {
  insights: string[]
  month: string
}
