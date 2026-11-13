import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>User Agreement</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Terms of Service</h1>
            <p className="text-xs text-brand-muted">Last updated: November 2026</p>
          </div>

          <div className="prose prose-slate text-sm text-slate-700 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">1. Service Description</h2>
              <p>
                ReceiptIQ is a personal and business purchase management SaaS tool that enables users to scan, organize, itemize, and track warranties on receipts and invoices.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">2. User Verification Responsibility</h2>
              <p>
                While ReceiptIQ utilizes advanced optical character recognition (OCR) and artificial intelligence algorithms to parse receipts, automated systems may encounter illegible printing, poor lighting, or obscured document elements. Users are provided with an editable verification step and are responsible for reviewing and confirming extracted amounts before relying on them for official accounting or tax filings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">3. Warranty Tracking Notice</h2>
              <p>
                Warranty statuses calculated in ReceiptIQ (Active, Expiring Soon, Expired) represent informational tracking tools based on the dates and terms found in your uploaded records or manually entered by you. They do not constitute a legal guarantee or warranty policy underwritten by ReceiptIQ.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-brand-navy">4. Acceptable Use</h2>
              <p>
                You agree not to upload malicious scripts, malware, or fraudulent documents designed to disrupt system infrastructure or bypass access control systems.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
