from pydantic import BaseModel
from decimal import Decimal


class CategorySpend(BaseModel):
    category_id: int | None
    category_name: str
    category_color: str
    category_icon: str
    total: Decimal
    count: int
    percent: float


class MonthlyTrend(BaseModel):
    month: str
    income: Decimal
    expenses: Decimal
    savings: Decimal
    savings_rate: float


class DashboardSummary(BaseModel):
    month: str
    total_income: Decimal
    total_expenses: Decimal
    net_savings: Decimal
    savings_rate: float
    total_balance: Decimal
    top_categories: list[CategorySpend]
    monthly_trend: list[MonthlyTrend]
    budget_utilization: list[dict]
    recent_transactions: list[dict]
    anomaly_count: int
    unread_alerts: int


class ForecastItem(BaseModel):
    category_name: str
    category_color: str
    predicted_amount: Decimal
    last_month_amount: Decimal
    change_percent: float


class PatternAnalysis(BaseModel):
    weekday_spending: Decimal
    weekend_spending: Decimal
    top_merchants: list[dict]
    recurring_transactions: list[dict]
    avg_daily_spend: Decimal
