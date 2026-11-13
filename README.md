# ReceiptIQ — Your purchases. Understood.

> **ReceiptIQ** is an AI-powered purchase and receipt management SaaS platform designed to transform raw purchase receipts (photographs, screenshots, and PDFs) into structured, actionable financial intelligence, automated warranty tracking, and purchase memory.

---

## 🌟 Key Features

1. **Smart Receipt Scanner**: Upload JPG, PNG, WEBP, or multi-page PDF documents. The pipeline pre-processes images, normalizes contrast, extracts text via OCR & digital PDF parsers, and structures line items, subtotal, GST/tax breakdowns, discounts, and payment methods.
2. **Three-Colour Traffic-Light Quality System**:
   - 🟢 **Green**: High extraction confidence, complete critical fields, internally verified financial math.
   - 🟡 **Yellow**: Minor non-critical fields missing (e.g. invoice number) or moderate OCR confidence.
   - 🔴 **Red**: Critical fields unreadable or math discrepancies requiring manual confirmation before saving. *(Note: Red does not imply purchase invalidity).*
3. **Editable Verification Step**: Users review and refine every extracted field, line item, and tax breakdown before committing to the digital vault.
4. **Automated Warranty Manager**: Automatically detects warranty terms from invoices or enables manual entry. Features real-time traffic-light countdowns:
   - 🟢 **Active**: > 30 days protection remaining.
   - 🟡 **Expiring Soon**: Expires within 30 days.
   - 🔴 **Expired**: Past warranty window.
5. **Ask ReceiptIQ (Grounded AI Purchase Assistant)**: Natural language Q&A strictly grounded in the user's authenticated purchase database records with zero hallucinated figures.
6. **Price Intelligence & Historical Comparison**: Compares historical prices paid for repetitive items across merchants, visualizing trends (stable, increasing, decreasing) and best recorded prices.
7. **Expense Analytics & Financial Dashboard**: Daily, weekly, and monthly spending velocity charts, category allocation donuts, and average transaction metrics.
8. **Bank-Grade Isolation**: Strict Supabase Row Level Security (RLS) ensuring users can only read and write their own documents and records.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, PyMuPDF, Pillow, HTTPX, Uvicorn |
| **Database & Auth** | Supabase PostgreSQL 15+, Supabase Auth, Row Level Security (RLS) |
| **AI Extraction** | Structured JSON extraction (OpenAI GPT-4o-mini / Google Gemini / Heuristic Parser) |
| **Deployment** | Frontend on Vercel, Backend on Render / Docker |

---

## 📁 Repository Structure

```
├── frontend/                     # Next.js App Router Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)          # Landing, login, register, forgot-password, privacy, terms
│   │   │   ├── dashboard/        # Financial dashboard & summaries
│   │   │   ├── upload/           # Drag-and-drop scanner & verification form
│   │   │   ├── receipts/         # Digital vault & receipt details ([id])
│   │   │   ├── analytics/        # Recharts spending trends & category breakdown
│   │   │   ├── warranties/       # Warranty tracking & expiration alarms
│   │   │   ├── history/          # Price intelligence comparison
│   │   │   ├── assistant/        # "Ask ReceiptIQ" conversational memory
│   │   │   ├── settings/         # Currency & reminder preferences
│   │   │   └── profile/          # User profile & account security
│   │   ├── components/           # Reusable UI primitives, badges, layout, logo
│   │   └── lib/                  # Supabase client & typed backend API client
│   └── package.json
│
├── backend/                      # FastAPI Python REST API
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS, routers
│   │   ├── config.py             # Pydantic Settings
│   │   ├── core/                 # Auth verification, quality assessment
│   │   ├── models/               # Pydantic schemas (receipt, item, warranty, analytics)
│   │   ├── routers/              # Modular endpoints (receipts, analytics, warranties, assistant)
│   │   └── services/             # Image preprocessing, OCR engine, AI extraction, DB service
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
│
└── database/                     # PostgreSQL Migrations & RLS Policies
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   └── 002_rls_policies.sql
    └── seed.sql
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase)
1. Create a project in [Supabase](https://supabase.com).
2. In the Supabase SQL Editor, run:
   - `database/migrations/001_initial_schema.sql`
   - `database/migrations/002_rls_policies.sql`
   - `database/seed.sql`
3. Create a private storage bucket named `receipts`.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase and OpenAI/Gemini keys (or leave default for dev mode)

# Run test suite
python -m pytest tests/

# Start API server
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at: `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer; cross-tenant access is structurally impossible.
- **Signed URLs**: Uploaded documents are kept in private Supabase buckets.
- **Zero Hallucination AI Grounding**: The AI assistant answers queries exclusively using user-scoped database records.
