import { apiClient } from './client'
import type {
  LoginRequest, RegisterRequest, TokenResponse, User,
  Transaction, TransactionCreate, TransactionUpdate, TransactionListResponse,
  Account, AccountCreate, AccountUpdate,
  Category,
  Budget, BudgetCreate, BudgetUpdate,
  Goal, GoalCreate, GoalUpdate,
  DashboardData, CategoryBreakdown, MonthlyTrend,
  Alert, ChatResponse, InsightsResponse,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterRequest) => apiClient.post<TokenResponse>('/auth/register', data),
  login: (data: LoginRequest) => apiClient.post<TokenResponse>('/auth/login', data),
  me: () => apiClient.get<User>('/auth/me'),
  updateMe: (data: Partial<User>) => apiClient.patch<User>('/auth/me', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.post('/auth/change-password', data),
  deleteAccount: () => apiClient.delete('/auth/me'),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<TransactionListResponse>('/transactions', { params }),
  create: (data: TransactionCreate) => apiClient.post<Transaction>('/transactions', data),
  get: (id: number) => apiClient.get<Transaction>(`/transactions/${id}`),
  update: (id: number, data: TransactionUpdate) => apiClient.patch<Transaction>(`/transactions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/transactions/${id}`),
  exportCsv: (params?: { month?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    window.open(`/api/v1/transactions/export${query ? '?' + query : ''}`, '_blank')
  },
}

// ── Accounts ──────────────────────────────────────────────────────────────────
export const accountsApi = {
  list: () => apiClient.get<Account[]>('/accounts'),
  create: (data: AccountCreate) => apiClient.post<Account>('/accounts', data),
  update: (id: number, data: AccountUpdate) => apiClient.patch<Account>(`/accounts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/accounts/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => apiClient.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => apiClient.patch<Category>(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
}

// ── Budgets ───────────────────────────────────────────────────────────────────
export const budgetsApi = {
  list: (month?: string) => apiClient.get<Budget[]>('/budgets', { params: month ? { month } : {} }),
  create: (data: BudgetCreate) => apiClient.post<Budget>('/budgets', data),
  update: (id: number, data: BudgetUpdate) => apiClient.patch<Budget>(`/budgets/${id}`, data),
  delete: (id: number) => apiClient.delete(`/budgets/${id}`),
}

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsApi = {
  list: () => apiClient.get<Goal[]>('/goals'),
  create: (data: GoalCreate) => apiClient.post<Goal>('/goals', data),
  update: (id: number, data: GoalUpdate) => apiClient.patch<Goal>(`/goals/${id}`, data),
  delete: (id: number) => apiClient.delete(`/goals/${id}`),
  deposit: (id: number, amount: number) => apiClient.post<Goal>(`/goals/${id}/deposit`, { amount }),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: (month?: string) =>
    apiClient.get<DashboardData>('/analytics/dashboard', { params: month ? { month } : {} }),
  monthly: (months = 6) => apiClient.get<MonthlyTrend[]>('/analytics/monthly', { params: { months } }),
  categories: (month?: string) =>
    apiClient.get<CategoryBreakdown[]>('/analytics/categories', { params: month ? { month } : {} }),
  summary: (month?: string) =>
    apiClient.get('/analytics/summary', { params: month ? { month } : {} }),
  forecast: () => apiClient.get('/analytics/forecast'),
}

// ── Imports ───────────────────────────────────────────────────────────────────
export const importsApi = {
  preview: (file: File, accountId: number) => {
    const form = new FormData()
    form.append('file', file)
    form.append('account_id', String(accountId))
    return apiClient.post('/imports/preview', form)
  },
  import: (file: File, accountId: number) => {
    const form = new FormData()
    form.append('file', file)
    form.append('account_id', String(accountId))
    return apiClient.post('/imports/', form)
  },
  list: () => apiClient.get('/imports/'),
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: () => apiClient.get<Alert[]>('/alerts'),
  markRead: (id: number) => apiClient.patch(`/alerts/${id}/read`),
  markAllRead: () => apiClient.post('/alerts/mark-all-read'),
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string) => apiClient.post<ChatResponse>('/ai/chat', { message }),
  insights: (month?: string) =>
    apiClient.post<InsightsResponse>('/ai/insights', { month }),
  history: () => apiClient.get('/ai/history'),
  clearHistory: () => apiClient.delete('/ai/history'),
}
