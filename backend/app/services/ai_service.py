from sqlalchemy.orm import Session
from app.services.analytics_service import get_summary, get_monthly_trend, get_category_breakdown
from app.models.chat_message import ChatMessage
from app.core.config import settings
import datetime
import json

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
except ImportError:
    _client = None


SYSTEM_PROMPT = """You are SmartSpend AI, a friendly personal finance assistant.
You help users understand their spending patterns and make better financial decisions.

IMPORTANT RULES:
- You only use the financial data provided in the context — never invent numbers.
- When referencing amounts, always use ₹ symbol.
- Keep responses concise, friendly, and actionable (2-4 sentences or bullet points).
- Always clarify that your suggestions are educational guidance, not professional financial advice.
- If asked something outside your financial context data, say so honestly.
- Be encouraging and supportive, not judgmental about spending habits.
"""


def chat(db: Session, user_id: int, message: str) -> dict:
    today = datetime.date.today()
    current_month = today.strftime("%Y-%m")

    # Build financial context — computed by Python, not by LLM
    summary = get_summary(db, user_id, current_month)
    trend = get_monthly_trend(db, user_id, months=3)
    categories = get_category_breakdown(db, user_id, current_month)

    context = {
        "current_month": current_month,
        "current_month_summary": {
            "total_income": summary["total_income"],
            "total_expenses": summary["total_expenses"],
            "net_savings": summary["net_savings"],
            "savings_rate": summary["savings_rate"],
            "total_balance": summary["total_balance"],
        },
        "top_spending_categories": [
            {"name": c["category_name"], "total": c["total"], "percent": c["percent"]}
            for c in categories[:5]
        ],
        "last_3_months_trend": trend,
        "recent_anomalies": summary["anomaly_count"],
    }

    # Get chat history (last 6 messages)
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(6)
        .all()
    )
    history.reverse()

    messages = []
    for h in history:
        messages.append({"role": h.role, "content": h.content})

    context_msg = f"\n\n[Financial Context for {current_month}]\n{json.dumps(context, indent=2)}"
    messages.append({"role": "user", "content": message + context_msg})

    if _client and settings.ANTHROPIC_API_KEY:
        try:
            response = _client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
            reply = response.content[0].text
        except Exception:
            reply = _fallback_response(context, message)
    else:
        reply = _fallback_response(context, message)

    # Save to history
    db.add(ChatMessage(user_id=user_id, role="user", content=message))
    db.add(ChatMessage(user_id=user_id, role="assistant", content=reply, context_summary=current_month))
    db.commit()

    return {"reply": reply, "context_month": current_month, "context_summary": context}


def _fallback_response(context: dict, message: str) -> str:
    s = context["current_month_summary"]
    return (
        f"Based on your {context['current_month']} data: "
        f"Income ₹{s['total_income']:,.0f}, Expenses ₹{s['total_expenses']:,.0f}, "
        f"Savings ₹{s['net_savings']:,.0f} ({s['savings_rate']:.1f}% savings rate). "
        f"(AI assistant unavailable — configure ANTHROPIC_API_KEY for full responses.)"
    )


def generate_insights(db: Session, user_id: int, month: str) -> list[str]:
    summary = get_summary(db, user_id, month)
    trend = get_monthly_trend(db, user_id, months=3)
    categories = get_category_breakdown(db, user_id, month)

    if not _client or not settings.ANTHROPIC_API_KEY:
        return _fallback_insights(summary, trend, categories)

    context = {
        "month": month,
        "income": summary["total_income"],
        "expenses": summary["total_expenses"],
        "savings": summary["net_savings"],
        "savings_rate": summary["savings_rate"],
        "top_categories": [{"name": c["category_name"], "total": c["total"]} for c in categories[:5]],
        "trend": trend,
    }

    try:
        response = _client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=400,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": (
                    f"Generate 3 short, specific, actionable financial insights from this data. "
                    f"Use only the numbers provided. Format as a JSON array of strings.\n\n"
                    f"{json.dumps(context, indent=2)}"
                ),
            }],
        )
        text = response.content[0].text.strip()
        # Try to parse JSON array
        import re
        match = re.search(r'\[.*?\]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return [text]
    except Exception:
        return _fallback_insights(summary, trend, categories)


def _fallback_insights(summary: dict, trend: list, categories: list) -> list[str]:
    insights = []
    s = summary
    if s["savings_rate"] > 20:
        insights.append(f"Great job! Your savings rate of {s['savings_rate']:.1f}% is above the recommended 20% threshold.")
    elif s["savings_rate"] > 0:
        insights.append(f"Your savings rate is {s['savings_rate']:.1f}%. Consider targeting 20% for stronger financial health.")
    else:
        insights.append("You spent more than you earned this month. Review your biggest expense categories to find savings opportunities.")

    if categories:
        top = categories[0]
        insights.append(f"Your largest expense category is {top['category_name']} at ₹{top['total']:,.0f} ({top['percent']:.1f}% of total expenses).")

    if len(trend) >= 2:
        last = trend[-1]["expenses"]
        prev = trend[-2]["expenses"]
        if prev > 0:
            change = (last - prev) / prev * 100
            if change > 10:
                insights.append(f"Your expenses increased by {change:.1f}% compared to last month. Check your spending for any unusual patterns.")
            elif change < -10:
                insights.append(f"Your expenses decreased by {abs(change):.1f}% compared to last month. Keep up the good work!")

    return insights or ["Upload transactions to get personalized financial insights."]
