from typing import Dict, Any, List, Tuple
from ..models.receipt import DocumentStatus, ReceiptCreate

def evaluate_receipt_quality(
    data: ReceiptCreate,
    ocr_confidence: float = 0.95
) -> Tuple[DocumentStatus, str, List[str], List[str], List[str]]:
    """
    Evaluates receipt extraction quality using the 3-colour traffic light system:
    - GREEN: High confidence, critical fields present, calculations consistent.
    - YELLOW: Moderate confidence or minor missing optional fields.
    - RED: Critical fields missing or major math inconsistency requiring manual verification.
    
    Returns: (status, reason, missing_fields, inconsistencies, suggested_actions)
    """
    missing_fields: List[str] = []
    inconsistencies: List[str] = []
    suggested_actions: List[str] = []
    
    # 1. Check Critical Fields
    if not data.merchant_name or data.merchant_name.strip() in ["", "Unknown", "Unknown Merchant"]:
        missing_fields.append("Merchant Name")
        
    if not data.purchase_date:
        missing_fields.append("Purchase Date")
        
    if data.grand_total <= 0:
        missing_fields.append("Grand Total")

    # 2. Check Secondary Fields
    if not data.invoice_number and not data.receipt_number:
        missing_fields.append("Invoice / Receipt Number")

    # Note: payment_method is purely optional and doesn't downgrade to YELLOW if missing
    
    # 3. Check Financial Integrity
    # If items exist, check sum of item totals vs (subtotal or grand_total)
    if data.items:
        items_sum = sum(item.total_price for item in data.items)
        if data.subtotal > 0 and abs(items_sum - data.subtotal) > 1.0:
            inconsistencies.append(
                f"Line items total (₹{items_sum:.2f}) does not match recorded subtotal (₹{data.subtotal:.2f})"
            )
        elif data.subtotal == 0 and data.tax == 0 and abs(items_sum - data.grand_total) > 1.0:
            inconsistencies.append(
                f"Line items total (₹{items_sum:.2f}) does not match grand total (₹{data.grand_total:.2f})"
            )
            
    # Check Subtotal + Tax - Discount vs Grand Total
    expected_total = (data.subtotal or 0.0) + (data.tax or 0.0) + (data.additional_charges or 0.0) + (data.delivery_fees or 0.0) - (data.discount or 0.0)
    if data.subtotal > 0 and data.grand_total > 0:
        if abs(expected_total - data.grand_total) > 2.0:
            inconsistencies.append(
                f"Calculated sum (Subtotal + Taxes - Discounts = ₹{expected_total:.2f}) differs from Grand Total (₹{data.grand_total:.2f})"
            )

    # 4. Assess Traffic Light Status
    if "Merchant Name" in missing_fields or "Grand Total" in missing_fields or ocr_confidence < 0.60 or len(inconsistencies) > 0:
        status = DocumentStatus.RED
        reasons = []
        if "Merchant Name" in missing_fields or "Grand Total" in missing_fields:
            reasons.append("Critical purchase fields are unreadable or missing")
        if inconsistencies:
            reasons.append("Financial totals require manual verification")
        if ocr_confidence < 0.60:
            reasons.append("Document image resolution or lighting was low")
            
        reason = "; ".join(reasons) if reasons else "Receipt requires manual review before saving."
        suggested_actions.append("Review and manually enter or adjust the flagged fields.")
        suggested_actions.append("Verify the grand total matches your actual bank/card charge.")
        
    elif len(missing_fields) > 0 or ocr_confidence < 0.85:
        status = DocumentStatus.YELLOW
        reason = f"Most key information extracted, but some secondary details ({', '.join(missing_fields)}) were not clearly visible."
        suggested_actions.append("Confirm the invoice number and payment method if needed.")
        
    else:
        status = DocumentStatus.GREEN
        reason = "All important purchase details successfully extracted with consistent financial totals."
        suggested_actions.append("Verify line items and save to your digital vault.")

    return status, reason, missing_fields, inconsistencies, suggested_actions
