import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..core.auth import get_current_user, AuthenticatedUser
from ..services.db_service import db_service
from ..config import settings
import httpx

router = APIRouter(prefix="/assistant", tags=["Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    referenced_receipt_ids: List[str] = []

@router.post("/chat", response_model=ChatResponse)
async def ask_receipt_iq(
    req: ChatRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Answers questions grounded strictly in the authenticated user's purchase records.
    Never invents records or discloses information outside the user's scope.
    """
    receipts = await db_service.get_receipts(user.user_id)
    warranties = await db_service.get_warranties(user.user_id)
    query = req.message.lower().strip()

    # Build concise purchase context
    records_context = []
    for r in receipts:
        items_summary = ", ".join([f"{it['product_name']} (₹{it['total_price']})" for it in r.get("items", [])])
        records_context.append({
            "id": r["id"],
            "merchant": r["merchant_name"],
            "date": str(r["purchase_date"]),
            "grand_total": r["grand_total"],
            "payment_method": r.get("payment_method"),
            "items": items_summary
        })

    warranties_context = []
    for w in warranties:
        warranties_context.append({
            "product": w["product_name"],
            "brand": w.get("brand"),
            "expiry_date": str(w["expiry_date"]),
            "days_remaining": w.get("days_remaining"),
            "status": str(w.get("status"))
        })

    # If an LLM key is available, query with prompt grounding
    if settings.OPENAI_API_KEY:
        system_prompt = (
            "You are 'Ask ReceiptIQ', a purchase memory assistant. "
            "You MUST answer strictly based on the user's saved purchase receipts and warranties provided in the context. "
            "Never invent receipts or amounts. If the information is not in the context, explicitly state: "
            "'I could not find that purchase in your saved receipts.' "
            "Always state amounts with the ₹ currency symbol."
        )
        context_str = f"User Purchases:\n{json.dumps(records_context, indent=2)}\n\nWarranties:\n{json.dumps(warranties_context, indent=2)}"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Context:\n{context_str}\n\nUser Question: {req.message}"}
                        ]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    reply = data["choices"][0]["message"]["content"]
                    return ChatResponse(reply=reply)
        except Exception:
            pass  # Fall back to heuristic engine

    # Grounded Query Engine (Deterministic, zero hallucinations)
    matched_receipt_ids = []
    
    # 1. Total spent queries
    if "how much" in query and ("spend" in query or "spent" in query or "total" in query):
        total = sum(r["grand_total"] for r in receipts)
        if "this month" in query:
            import datetime
            m = datetime.date.today().month
            m_total = sum(r["grand_total"] for r in receipts if r["purchase_date"].month == m)
            return ChatResponse(
                reply=f"Based on your recorded receipts, you have spent **₹{m_total:,.2f}** this month across {len([r for r in receipts if r['purchase_date'].month == m])} purchases."
            )
        return ChatResponse(
            reply=f"Your total recorded lifetime spending across all {len(receipts)} saved receipts is **₹{total:,.2f}**."
        )

    # 2. Most expensive purchase
    if "most expensive" in query or "highest" in query:
        if not receipts:
            return ChatResponse(reply="You don't have any receipts saved in ReceiptIQ yet.")
        most_expensive = max(receipts, key=lambda x: x["grand_total"])
        items_desc = f" ({most_expensive['items'][0]['product_name']})" if most_expensive.get("items") else ""
        return ChatResponse(
            reply=f"Your most expensive recorded purchase is **₹{most_expensive['grand_total']:,.2f}** at **{most_expensive['merchant_name']}**{items_desc} on {most_expensive['purchase_date']}.",
            referenced_receipt_ids=[most_expensive["id"]]
        )

    # 3. Warranties expiring soon
    if "warrant" in query or "expire" in query or "expiring" in query:
        if not warranties:
            return ChatResponse(reply="No active warranty records were found in your vault.")
        expiring = [w for w in warranties if w.get("days_remaining", 999) <= 60]
        if expiring:
            items_text = "\n".join([f"- **{w['product_name']}**: expires on {w['expiry_date']} ({w['days_remaining']} days remaining)" for w in expiring])
            return ChatResponse(
                reply=f"Here are your upcoming warranty expirations:\n\n{items_text}"
            )
        else:
            return ChatResponse(
                reply=f"You have {len(warranties)} tracked warranties, and none are expiring within the next 60 days."
            )

    # 4. Search for specific product or merchant
    found_matches = []
    for r in receipts:
        m_name = r["merchant_name"].lower()
        matched_items = [it for it in r.get("items", []) if any(w in it["product_name"].lower() for w in query.split() if len(w) > 3)]
        if any(w in m_name for w in query.split() if len(w) > 3) or matched_items:
            found_matches.append((r, matched_items))
            matched_receipt_ids.append(r["id"])

    if found_matches:
        r, items = found_matches[0]
        item_name = items[0]["product_name"] if items else r["merchant_name"]
        return ChatResponse(
            reply=f"I found a record for **{item_name}** from **{r['merchant_name']}** on **{r['purchase_date']}** for **₹{r['grand_total']:,.2f}** (Invoice: {r.get('invoice_number', 'N/A')}).",
            referenced_receipt_ids=matched_receipt_ids
        )

    # Default strictly grounded response
    return ChatResponse(
        reply=f"I checked all {len(receipts)} of your saved purchase records, but I couldn't find a direct match for your question. Try asking about a specific store name (e.g. 'Croma', 'Nature's Basket'), a product name (e.g. 'headphones'), or your total spending this month."
    )
