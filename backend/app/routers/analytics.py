from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date, timedelta
from collections import defaultdict
from ..core.auth import get_current_user, AuthenticatedUser
from ..services.db_service import db_service
from ..models.analytics import (
    SpendingSummary,
    CategoryBreakdownItem,
    DailySpendingItem,
    MonthlySpendingItem,
    PriceIntelligenceComparison
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=SpendingSummary)
async def get_spending_summary(
    currency: str = Query("INR", description="Preferred currency"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Computes accurate summary metrics from authenticated user receipts."""
    receipts = await db_service.get_receipts(user.user_id)
    today = date.today()
    curr_month = today.month
    curr_year = today.year
    prev_month = 12 if curr_month == 1 else curr_month - 1
    prev_year = curr_year - 1 if curr_month == 1 else curr_year

    curr_total = 0.0
    prev_total = 0.0
    lifetime_total = 0.0
    total_count = len(receipts)

    for r in receipts:
        p_date = r["purchase_date"]
        amt = float(r.get("grand_total") or 0.0)
        lifetime_total += amt

        if p_date.year == curr_year and p_date.month == curr_month:
            curr_total += amt
        elif p_date.year == prev_year and p_date.month == prev_month:
            prev_total += amt

    avg_val = (lifetime_total / total_count) if total_count > 0 else 0.0
    pct_change = 0.0
    if prev_total > 0:
        pct_change = round(((curr_total - prev_total) / prev_total) * 100, 1)

    return SpendingSummary(
        total_spending_current_month=round(curr_total, 2),
        total_spending_previous_month=round(prev_total, 2),
        percentage_change=pct_change,
        receipts_count=total_count,
        average_purchase_value=round(avg_val, 2),
        total_lifetime_spending=round(lifetime_total, 2),
        currency=currency
    )

@router.get("/categories", response_model=List[CategoryBreakdownItem])
async def get_category_breakdown(
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Category-wise breakdown of expenses."""
    receipts = await db_service.get_receipts(user.user_id)
    cat_totals = defaultdict(float)
    cat_counts = defaultdict(int)
    overall_total = 0.0

    for r in receipts:
        items = r.get("items", [])
        if items:
            for item in items:
                cat = item.get("category") or r.get("category") or "Other"
                amt = float(item.get("total_price") or 0.0)
                cat_totals[cat] += amt
                cat_counts[cat] += 1
                overall_total += amt
        else:
            cat = r.get("category") or "Other"
            amt = float(r.get("grand_total") or 0.0)
            cat_totals[cat] += amt
            cat_counts[cat] += 1
            overall_total += amt

    breakdown = []
    for cat, total in cat_totals.items():
        pct = round((total / overall_total * 100), 1) if overall_total > 0 else 0.0
        breakdown.append(CategoryBreakdownItem(
            category=cat,
            total_amount=round(total, 2),
            count=cat_counts[cat],
            percentage=pct
        ))

    # Sort descending by total
    return sorted(breakdown, key=lambda x: x.total_amount, reverse=True)

@router.get("/spending", response_model=List[DailySpendingItem])
async def get_spending_timeline(
    days: int = Query(30, ge=7, le=365),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Spending over recent days."""
    receipts = await db_service.get_receipts(user.user_id)
    today = date.today()
    start_date = today - timedelta(days=days)

    day_map = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for d in range(days + 1):
        dt = start_date + timedelta(days=d)
        day_map[dt.isoformat()] = {"amount": 0.0, "count": 0}

    for r in receipts:
        p_date = r["purchase_date"]
        if p_date >= start_date:
            ds = p_date.isoformat()
            amt = float(r.get("grand_total") or 0.0)
            day_map[ds]["amount"] += amt
            day_map[ds]["count"] += 1

    result = [
        DailySpendingItem(date=d, amount=round(v["amount"], 2), count=v["count"])
        for d, v in sorted(day_map.items())
    ]
    return result

@router.get("/monthly", response_model=List[MonthlySpendingItem])
async def get_monthly_spending_trends(
    months: int = Query(6, ge=3, le=24),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Calculates monthly spending trends from actual saved receipts."""
    receipts = await db_service.get_receipts(user.user_id)
    month_map = defaultdict(lambda: {"amount": 0.0, "count": 0})

    # Prepare list of previous N months in chronological order
    today = date.today()
    for i in range(months - 1, -1, -1):
        # Approximate month subtraction
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        key = f"{year:04d}-{month:02d}"
        month_map[key] = {"amount": 0.0, "count": 0}

    for r in receipts:
        p_date = r["purchase_date"]
        key = f"{p_date.year:04d}-{p_date.month:02d}"
        if key in month_map:
            amt = float(r.get("grand_total") or 0.0)
            month_map[key]["amount"] += amt
            month_map[key]["count"] += 1

    result = [
        MonthlySpendingItem(
            month=k,
            amount=round(v["amount"], 2),
            count=v["count"]
        )
        for k, v in sorted(month_map.items())
    ]
    return result

@router.get("/price-intelligence", response_model=List[PriceIntelligenceComparison])
async def get_price_intelligence(
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Compares price differences when the same product has been purchased across multiple receipts."""
    receipts = await db_service.get_receipts(user.user_id)
    products_map = defaultdict(list)

    for r in receipts:
        for it in r.get("items", []):
            name = it.get("product_name", "").strip()
            if name:
                products_map[name.lower()].append({
                    "product_name": name,
                    "date": str(r["purchase_date"]),
                    "merchant": r["merchant_name"],
                    "unit_price": float(it.get("unit_price") or it.get("total_price") or 0.0)
                })

    comparisons = []
    for norm_name, purchases in products_map.items():
        if len(purchases) >= 1:
            prices = [p["unit_price"] for p in purchases if p["unit_price"] > 0]
            if not prices:
                continue
            lowest = min(prices)
            highest = max(prices)
            avg = sum(prices) / len(prices)
            
            trend = "STABLE"
            if len(prices) > 1:
                if prices[-1] > prices[0]:
                    trend = "INCREASING"
                elif prices[-1] < prices[0]:
                    trend = "DECREASING"

            display_name = purchases[0]["product_name"]
            comparisons.append(PriceIntelligenceComparison(
                product_name=display_name,
                lowest_price=round(lowest, 2),
                highest_price=round(highest, 2),
                average_price=round(avg, 2),
                purchase_count=len(purchases),
                price_trend=trend,
                purchases=purchases
            ))

    return sorted(comparisons, key=lambda x: x.purchase_count, reverse=True)
