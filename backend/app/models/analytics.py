from pydantic import BaseModel
from typing import List, Dict, Optional

class SpendingSummary(BaseModel):
    total_spending_current_month: float
    total_spending_previous_month: float
    percentage_change: float
    receipts_count: int
    average_purchase_value: float
    total_lifetime_spending: float
    currency: str = "INR"

class CategoryBreakdownItem(BaseModel):
    category: str
    total_amount: float
    count: int
    percentage: float

class DailySpendingItem(BaseModel):
    date: str
    amount: float
    count: int

class MonthlySpendingItem(BaseModel):
    month: str
    amount: float
    count: int

class PriceIntelligenceComparison(BaseModel):
    product_name: str
    lowest_price: float
    highest_price: float
    average_price: float
    purchase_count: int
    price_trend: str  # "STABLE", "INCREASING", "DECREASING"
    purchases: List[Dict] = []
