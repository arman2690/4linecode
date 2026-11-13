import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.receipt import ReceiptCreate, DocumentStatus
from app.core.quality import evaluate_receipt_quality
from datetime import date

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["features"]["ai_extraction"] is True

def test_list_receipts():
    response = client.get("/api/receipts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_quality_traffic_light_assessment():
    # Green case
    good_receipt = ReceiptCreate(
        merchant_name="Apple Store",
        purchase_date=date(2026, 11, 1),
        subtotal=1000.0,
        tax=180.0,
        grand_total=1180.0,
        invoice_number="INV-1001",
        items=[]
    )
    status, reason, missing, inconsistencies, actions = evaluate_receipt_quality(good_receipt, 0.98)
    assert status == DocumentStatus.GREEN

    # Red case (missing critical fields)
    bad_receipt = ReceiptCreate(
        merchant_name="",
        purchase_date=date(2026, 11, 1),
        grand_total=0.0,
        items=[]
    )
    status, reason, missing, inconsistencies, actions = evaluate_receipt_quality(bad_receipt, 0.98)
    assert status == DocumentStatus.RED
    assert "Merchant Name" in missing
    assert "Grand Total" in missing

def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_spending_current_month" in data
    assert "receipts_count" in data

def test_warranties_list():
    response = client.get("/api/warranties")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_assistant_chat():
    response = client.post("/api/assistant/chat", json={"message": "How much did I spend in total?"})
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "₹" in data["reply"]
