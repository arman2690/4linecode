"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { 
  ScanLine, 
  Sparkles, 
  ShieldCheck, 
  PieChart, 
  Clock, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Lock, 
  Layers, 
  TrendingUp,
  ChevronDown
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
            <a href="#features" className="hover:text-brand-navy transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-navy transition-colors">How It Works</a>
            <a href="#security" className="hover:text-brand-navy transition-colors">Security</a>
            <a href="#faq" className="hover:text-brand-navy transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-brand-navy hover:text-brand-blue px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-brand-navy hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-subtle transition-all hover:shadow-card"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Powered by Intelligent OCR & Multi-Currency Memory</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-navy leading-[1.15]">
                Every purchase tells a story.{" "}
                <span className="text-brand-blue">Understand yours.</span>
              </h1>

              <p className="text-lg sm:text-xl text-brand-muted max-w-2xl leading-relaxed">
                Scan receipts, organize purchases, track expenses and keep every important purchase detail in one place. No more fading paper receipts or lost warranties.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-xl shadow-card transition-all hover:-translate-y-0.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-brand-navy font-semibold px-6 py-3.5 rounded-xl transition-all"
                >
                  <ScanLine className="w-4 h-4 text-brand-blue" />
                  <span>Explore Features</span>
                </a>
              </div>

              {/* Supported Platforms / Formats pill */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-brand-muted justify-center lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green" /> JPG, PNG & PDFs
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green" /> GST & Tax Line Breakdown
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green" /> Traffic-Light Validation
                </span>
              </div>
            </div>

            {/* Right Interactive Receipt Demo Simulation */}
            <div id="demo" className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl border border-brand-border shadow-elevated p-6 space-y-5">
                {/* Mock Receipt Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-brand-navy">
                      ⚡
                    </div>
                    <div>
                      <div className="text-sm font-bold text-brand-navy">Croma Electronics</div>
                      <div className="text-xs text-brand-muted">Tax Invoice #CRO-8812</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Verified
                  </span>
                </div>

                {/* Extracted Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-muted pb-1 border-b border-slate-100">
                    <span>ITEM & CATEGORY</span>
                    <span>AMOUNT</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-brand-navy">Sony WH-1000XM5 Headphones</p>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        Electronics
                      </span>
                    </div>
                    <span className="font-mono font-bold text-brand-navy">₹22,998.20</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-brand-muted">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">₹19,490.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="font-mono">₹3,508.20</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-brand-navy pt-2 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span className="font-mono text-brand-blue">₹22,998.20</span>
                    </div>
                  </div>
                </div>

                {/* AI Extracted Smart Pill */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Warranty Auto-Tracked: </span>
                    <span className="text-blue-800">2-Year manufacturer warranty expires on Nov 2, 2028 (720 days left).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section id="features" className="py-20 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-brand-blue">Core Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              Engineered for Complete Purchase Clarity
            </p>
            <p className="text-brand-muted text-base sm:text-lg">
              Everything you need to turn chaotic receipts into structured digital records with warranty alarms and price intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Smart Receipt Scanning</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Upload JPG, PNG or multi-page PDF documents. Our OCR engine handles skewed orientations, corrects lighting, and itemizes every line without guesswork.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Traffic-Light Quality System</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Instant assessment: Green for verified totals, Yellow for missing secondary fields, and Red when manual confirmation is advised before saving.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Warranty Manager</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Automatically detect explicit warranty terms from invoices or enter them manually. Receive advance alerts before warranties expire.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-brand-yellow flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Ask ReceiptIQ AI</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                A strictly grounded AI assistant. Ask "How much did I spend on electronics this month?" or "Where did I buy my laptop?" with zero hallucinated figures.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Spending Analytics</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Visual breakdowns of daily and monthly spending trends across categories like Groceries, Electronics, Healthcare, and Travel with currency toggling.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-7 rounded-2xl border border-brand-border shadow-subtle hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy">Price Intelligence</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Compare historical prices paid for repetitive items across merchants to identify inflation trends and your best past deals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-brand-blue">Simple Workflow</h2>
            <p className="text-3xl font-extrabold text-brand-navy">From Paper to Searchable Memory</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mx-auto md:mx-0">
                1
              </div>
              <h4 className="font-bold text-lg text-brand-navy">Upload Document</h4>
              <p className="text-sm text-brand-muted">Drop a photo from your phone or attach an email PDF invoice.</p>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mx-auto md:mx-0">
                2
              </div>
              <h4 className="font-bold text-lg text-brand-navy">Intelligent Extraction</h4>
              <p className="text-sm text-brand-muted">OCR and AI parse taxes, merchant details, items, and warranty durations.</p>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mx-auto md:mx-0">
                3
              </div>
              <h4 className="font-bold text-lg text-brand-navy">Verify & Confirm</h4>
              <p className="text-sm text-brand-muted">Review every single field before committing to your digital vault.</p>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm mx-auto md:mx-0">
                4
              </div>
              <h4 className="font-bold text-lg text-brand-navy">Query Anytime</h4>
              <p className="text-sm text-brand-muted">Search by item, download originals, track warranties, or chat with AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section id="security" className="py-20 bg-brand-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-brand-border">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center flex-shrink-0">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-brand-navy">Private by Architecture</h3>
                <p className="text-sm text-brand-muted mt-1">
                  Financial receipts are deeply personal documents. ReceiptIQ implements bank-grade isolation standards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-sm">
              <div className="space-y-2">
                <h5 className="font-semibold text-brand-navy">Row Level Security</h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  PostgreSQL database policies enforce strict isolation. Only your authenticated user credentials can ever query your records.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-brand-navy">Private Storage Buckets</h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Your uploaded receipt images are never stored in public buckets. File downloads require time-limited signed authorization tokens.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-brand-navy">Zero Ad Monetization</h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Your purchase data belongs to you alone. We do not sell receipt information or aggregate data to third-party advertisers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-2">
            <h2 className="text-xs uppercase tracking-widest font-bold text-brand-blue">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-brand-navy">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What types of receipts can I upload?",
                a: "You can upload pictures taken on your smartphone (JPG, JPEG, PNG, WEBP) or digital invoices and receipts in PDF format up to 15 MB in size.",
              },
              {
                q: "How does the Traffic-Light Quality system work?",
                a: "Every receipt undergoes automated consistency checks. Green means key fields and math are fully verified; Yellow indicates minor details like invoice numbers are missing; Red flags receipts that need manual amount confirmation before saving.",
              },
              {
                q: "Can I edit extracted information before saving?",
                a: "Yes! Every single extracted field — merchant name, dates, line items, tax breakdown, and warranty dates — is presented in an editable verification form before anything is saved.",
              },
              {
                q: "Does Ask ReceiptIQ invent or guess purchase amounts?",
                a: "Never. The assistant is grounded strictly in your saved receipts. If an item or price is not in your recorded history, it will tell you clearly that it cannot be found.",
              },
              {
                q: "What currencies are supported?",
                a: "ReceiptIQ is optimized primarily for INR (₹) with native GST line item breakdowns, but seamlessly supports USD ($), EUR (€), GBP (£) and custom currencies.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-brand-border rounded-xl p-5 bg-brand-bg transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-brand-navy gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-muted transition-transform ${
                      activeFaq === idx ? "rotate-180 text-brand-blue" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <p className="mt-3 text-sm text-brand-muted leading-relaxed border-t border-slate-200 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            <div className="space-y-4 md:col-span-2">
              <Logo size="md" className="text-white" />
              <p className="text-sm text-slate-400 max-w-sm">
                Your purchases. Understood. The AI-powered purchase and receipt management platform.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs uppercase tracking-wider font-bold text-white">Product</h5>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/upload" className="hover:text-white transition-colors">Scan Receipt</Link></li>
                <li><Link href="/warranties" className="hover:text-white transition-colors">Warranty Tracker</Link></li>
                <li><Link href="/assistant" className="hover:text-white transition-colors">Ask ReceiptIQ</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs uppercase tracking-wider font-bold text-white">Legal & Privacy</h5>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security Architecture</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} ReceiptIQ. All rights reserved.</p>
            <p>Designed for complete purchase memory and warranty peace of mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
