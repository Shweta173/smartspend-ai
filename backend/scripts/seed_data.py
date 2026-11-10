"""
Seed a demo user with 6 months of realistic transactions.
Run once: python scripts/seed_data.py
Idempotent — skips if demo@smartspend.ai already exists.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
import app.models  # noqa
from app.core.security import hash_password
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.services.category_service import DEFAULT_CATEGORIES
from decimal import Decimal
import random, datetime, calendar

Base.metadata.create_all(bind=engine)
db = SessionLocal()

DEMO_EMAIL = "demo@smartspend.ai"
DEMO_PASSWORD = "Demo@1234"

if db.query(User).filter(User.email == DEMO_EMAIL).first():
    print("Demo user already exists — skipping seed.")
    db.close()
    sys.exit(0)

# Create demo user
user = User(
    email=DEMO_EMAIL,
    full_name="Priya Sharma",
    hashed_password=hash_password(DEMO_PASSWORD),
    currency="INR",
    theme="light",
    is_active=True,
)
db.add(user)
db.flush()

# Accounts
savings = Account(user_id=user.id, name="HDFC Savings", account_type="savings", color="#10B981", icon="landmark", balance=Decimal("0.00"))
cash = Account(user_id=user.id, name="Cash Wallet", account_type="cash", color="#F59E0B", icon="wallet", balance=Decimal("0.00"))
credit = Account(user_id=user.id, name="ICICI Credit Card", account_type="credit_card", color="#8B5CF6", icon="credit-card", balance=Decimal("0.00"))
db.add_all([savings, cash, credit])
db.flush()

# Categories
cats = {}
for c in DEFAULT_CATEGORIES:
    cat = Category(user_id=user.id, is_default=True, **c)
    db.add(cat)
    db.flush()
    cats[c["name"]] = cat

# Goals
db.add(SavingsGoal(user_id=user.id, name="Emergency Fund", target_amount=Decimal("150000"), current_amount=Decimal("45000"), target_date=datetime.date(2025, 6, 1), icon="shield", color="#10B981"))
db.add(SavingsGoal(user_id=user.id, name="New Laptop", target_amount=Decimal("80000"), current_amount=Decimal("32000"), target_date=datetime.date(2025, 3, 1), icon="laptop", color="#8B5CF6"))
db.add(SavingsGoal(user_id=user.id, name="Goa Trip", target_amount=Decimal("30000"), current_amount=Decimal("12000"), target_date=datetime.date(2025, 1, 15), icon="plane", color="#F97316"))
db.flush()

# Transactions — 6 months of realistic data
today = datetime.date.today()
all_txns = []

MONTHLY_EXPENSES = [
    # (description, merchant, amount_range, category, type, account)
    ("HDFC SALARY CREDIT", "HDFC Bank", (75000, 85000), "Salary", "credit", savings),
    ("Swiggy Food Order", "Swiggy", (200, 800), "Food & Dining", "debit", savings),
    ("Swiggy Food Order", "Swiggy", (150, 600), "Food & Dining", "debit", credit),
    ("Zomato Order", "Zomato", (300, 900), "Food & Dining", "debit", savings),
    ("BigBasket Grocery", "BigBasket", (1200, 3500), "Groceries", "debit", savings),
    ("Uber Ride", "Uber", (80, 400), "Transport", "debit", savings),
    ("Ola Cab", "Ola", (100, 350), "Transport", "debit", credit),
    ("Netflix Subscription", "Netflix", (649, 649), "Subscriptions", "debit", credit),
    ("Spotify Premium", "Spotify", (119, 119), "Subscriptions", "debit", credit),
    ("Amazon Shopping", "Amazon", (500, 5000), "Shopping", "debit", credit),
    ("Electricity Bill", "BESCOM", (800, 1800), "Bills & Utilities", "debit", savings),
    ("Mobile Recharge", "Jio", (299, 299), "Bills & Utilities", "debit", savings),
    ("HDFC Broadband", "HDFC Net", (699, 699), "Bills & Utilities", "debit", savings),
    ("House Rent", "Landlord", (22000, 22000), "Rent", "debit", savings),
    ("Apollo Pharmacy", "Apollo", (200, 1500), "Healthcare", "debit", savings),
    ("Gym Membership", "Cult.fit", (1499, 1499), "Healthcare", "debit", credit),
    ("Flipkart Order", "Flipkart", (400, 3000), "Shopping", "debit", credit),
    ("Freelance Income", "Client", (15000, 25000), "Freelance", "credit", savings),
    ("ATM Withdrawal", "ATM", (2000, 5000), "Other Expense", "debit", cash),
    ("IRCTC Train Ticket", "IRCTC", (500, 2500), "Travel", "debit", savings),
    ("Petrol", "HP Petrol", (500, 1500), "Transport", "debit", cash),
    ("Restaurant Dining", "Restaurant", (500, 2000), "Food & Dining", "debit", cash),
]

for i in range(6, 0, -1):
    m = today.month - i
    y = today.year
    while m <= 0:
        m += 12
        y -= 1
    days_in_month = calendar.monthrange(y, m)[1]

    # Pick ~15-20 transactions per month
    monthly_sample = random.sample(MONTHLY_EXPENSES, min(18, len(MONTHLY_EXPENSES)))
    for desc, merchant, (lo, hi), cat_name, txn_type, acct in monthly_sample:
        day = random.randint(1, days_in_month)
        amt = Decimal(str(random.randint(lo, hi)))
        cat = cats.get(cat_name)
        txn = Transaction(
            user_id=user.id,
            account_id=acct.id,
            category_id=cat.id if cat else None,
            txn_date=datetime.date(y, m, day),
            description=desc,
            merchant=merchant,
            amount=amt,
            txn_type=txn_type,
            category_source="rule",
        )
        all_txns.append((txn, acct, txn_type, amt))

for txn, acct, txn_type, amt in all_txns:
    db.add(txn)
    if txn_type == "credit":
        acct.balance = Decimal(str(acct.balance)) + amt
    elif txn_type == "debit":
        acct.balance = Decimal(str(acct.balance)) - amt

# Current month budgets
current_month = datetime.date(today.year, today.month, 1)
budget_cats = [
    ("Food & Dining", 8000), ("Groceries", 5000), ("Transport", 3000),
    ("Shopping", 10000), ("Subscriptions", 2000), ("Bills & Utilities", 4000),
    ("Entertainment", 3000), ("Travel", 5000),
]
for cat_name, limit in budget_cats:
    cat = cats.get(cat_name)
    if cat:
        db.add(Budget(user_id=user.id, category_id=cat.id, month=current_month, limit_amount=Decimal(str(limit))))

db.commit()
db.close()
print(f"Demo user created: {DEMO_EMAIL} / {DEMO_PASSWORD}")
print(f"Seeded {len(all_txns)} transactions across 6 months.")
