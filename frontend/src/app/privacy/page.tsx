import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <header className="bg-white border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-navy"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-2xl border border-brand-border p-8 sm:p-12 shadow-card space-y-8">
          <div className="space-y-2 border-b border-brand-border pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-brand-green" />
              <span>Security & Confidentiality</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-brand-muted">Last updated: November 2026</p>
          </div>

          <div className="prose prose-slate text-sm text-slate-700 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">1. Information We Collect</h2>
              <p>
                ReceiptIQ collects only the data necessary to provide receipt intelligence, warranty tracking, and purchase organization services. This includes account credentials (email address, full name), receipt and invoice files you explicitly upload (JPG, PNG, WEBP, PDF), and extracted transactional metadata (merchant names, dates, amounts, line items, and warranty durations).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">2. How Your Documents Are Processed</h2>
              <p>
                Uploaded receipt images and PDFs are preprocessed to optimize readability, processed using OCR engines, and parsed into structured financial records. Documents are stored in private cloud storage accessible solely through time-limited authenticated tokens.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">3. Row Level Security & User Isolation</h2>
              <p>
                Our database enforces PostgreSQL Row Level Security (RLS). Every query is strictly isolated by authenticated user identifiers. No user can view, search, or access another user’s receipts or warranty records.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">4. No Sale of Personal Data</h2>
              <p>
                We do not sell, rent, monetize, or trade your receipt contents, purchase habits, or financial records to third-party advertisers, data brokers, or marketing networks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">5. Data Retention & Deletion</h2>
              <p>
                You retain complete ownership of your data. You may delete any receipt, warranty record, or your entire account at any time. Deleting a record permanently purges the associated metadata and original file attachments.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
