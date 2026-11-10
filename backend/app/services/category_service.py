from sqlalchemy.orm import Session
from app.models.category import Category

DEFAULT_CATEGORIES = [
    # Expense categories
    {"name": "Food & Dining", "type": "expense", "icon": "utensils", "color": "#F97316"},
    {"name": "Shopping", "type": "expense", "icon": "shopping-bag", "color": "#8B5CF6"},
    {"name": "Transport", "type": "expense", "icon": "car", "color": "#3B82F6"},
    {"name": "Entertainment", "type": "expense", "icon": "tv", "color": "#EC4899"},
    {"name": "Bills & Utilities", "type": "expense", "icon": "zap", "color": "#EAB308"},
    {"name": "Healthcare", "type": "expense", "icon": "heart-pulse", "color": "#EF4444"},
    {"name": "Education", "type": "expense", "icon": "book-open", "color": "#06B6D4"},
    {"name": "Travel", "type": "expense", "icon": "plane", "color": "#10B981"},
    {"name": "Subscriptions", "type": "expense", "icon": "repeat", "color": "#6366F1"},
    {"name": "Rent", "type": "expense", "icon": "home", "color": "#F59E0B"},
    {"name": "Groceries", "type": "expense", "icon": "shopping-cart", "color": "#84CC16"},
    {"name": "Personal Care", "type": "expense", "icon": "sparkles", "color": "#F472B6"},
    {"name": "Investments", "type": "expense", "icon": "trending-up", "color": "#14B8A6"},
    {"name": "Other Expense", "type": "expense", "icon": "circle-dot", "color": "#94A3B8"},
    # Income categories
    {"name": "Salary", "type": "income", "icon": "briefcase", "color": "#10B981"},
    {"name": "Freelance", "type": "income", "icon": "laptop", "color": "#22C55E"},
    {"name": "Investment Returns", "type": "income", "icon": "trending-up", "color": "#16A34A"},
    {"name": "Gift", "type": "income", "icon": "gift", "color": "#4ADE80"},
    {"name": "Other Income", "type": "income", "icon": "plus-circle", "color": "#86EFAC"},
]

RULE_MAP = {
    "swiggy": "Food & Dining",
    "zomato": "Food & Dining",
    "uber eats": "Food & Dining",
    "dominos": "Food & Dining",
    "mcdonald": "Food & Dining",
    "uber": "Transport",
    "ola": "Transport",
    "rapido": "Transport",
    "irctc": "Travel",
    "makemytrip": "Travel",
    "goibibo": "Travel",
    "netflix": "Subscriptions",
    "spotify": "Subscriptions",
    "amazon prime": "Subscriptions",
    "hotstar": "Subscriptions",
    "youtube": "Subscriptions",
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "myntra": "Shopping",
    "ajio": "Shopping",
    "nykaa": "Shopping",
    "bigbasket": "Groceries",
    "zepto": "Groceries",
    "blinkit": "Groceries",
    "jiomart": "Groceries",
    "electricity": "Bills & Utilities",
    "water bill": "Bills & Utilities",
    "broadband": "Bills & Utilities",
    "mobile recharge": "Bills & Utilities",
    "rent": "Rent",
    "pharmacy": "Healthcare",
    "hospital": "Healthcare",
    "clinic": "Healthcare",
    "salary": "Salary",
    "stipend": "Salary",
}


def seed_default_categories(db: Session, user_id: int) -> None:
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user_id, is_default=True, **cat))
    db.commit()


def get_category_by_rule(description: str, categories: list[Category]) -> Category | None:
    desc_lower = description.lower()
    cat_map = {c.name: c for c in categories}
    for keyword, cat_name in RULE_MAP.items():
        if keyword in desc_lower and cat_name in cat_map:
            return cat_map[cat_name]
    return None
