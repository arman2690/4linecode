"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  Building,
  CreditCard,
  FileText,
  ShieldCheck,
  Trash2,
  Edit3,
  Save,
  Clock,
  Printer,
  Tag,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [currency, setCurrency] = useState("INR");

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const activeCurr = localStorage.getItem("receiptiq_currency") || "INR";
      setCurrency(activeCurr);
      const data = await api.getReceipt(receiptId);
      setReceipt(data);
      setFormData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (receiptId) fetchReceipt();
  }, [receiptId]);

  const handleUpdate = async () => {
    try {
      const updated = await api.updateReceipt(receiptId, formData);
      setReceipt(updated);
      setEditing(false);
    } catch (err) {
      alert("Failed to update receipt");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this purchase receipt?")) {
      try {
        await api.deleteReceipt(receiptId);
        router.push("/receipts");
      } catch (err) {
        alert("Failed to delete receipt");
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-xs text-brand-muted">Loading receipt record...</div>
      </AppLayout>
    );
  }

  if (!receipt) {
    return (
      <AppLayout>
        <div className="p-12 text-center space-y-4">
          <p className="font-bold text-brand-navy">Receipt not found</p>
          <Link href="/receipts" className="text-xs font-semibold text-brand-blue hover:underline">
            Back to All Receipts
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between">
          <Link
            href="/receipts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-navy"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vault</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-brand-navy rounded-lg border border-slate-200 bg-white"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editing ? "Cancel" : "Edit"}</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 bg-white"
              title="Delete Receipt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quality Banner */}
        <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={receipt.document_status || "GREEN"} />
            <div>
              <p className="text-xs font-bold text-brand-navy">
                Document Quality: {receipt.document_status} (Confidence: {Math.round((receipt.extraction_confidence || 1) * 100)}%)
              </p>
              <p className="text-[11px] text-brand-muted">{receipt.document_status_reason || "All fields verified."}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">ID: {receipt.id.slice(0, 8)}...</span>
        </div>

        {/* Main Document Details Card */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-8">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dashed border-slate-200">
            <div>
              {editing ? (
                <input
                  type="text"
                  value={formData.merchant_name}
                  onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                  className="text-2xl font-black text-brand-navy border border-slate-200 px-2 py-1 rounded-lg"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
                  {receipt.merchant_name}
                </h1>
              )}
              <p className="text-xs text-brand-muted font-mono mt-1">
                Invoice / Bill #{receipt.invoice_number || receipt.receipt_number || "N/A"}
              </p>
              {receipt.merchant_address && (
                <p className="text-xs text-slate-500 mt-0.5">{receipt.merchant_address}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-brand-muted block">Grand Total</span>
              <div className="text-3xl font-black font-mono text-brand-navy">
                {formatCurrency(receipt.grand_total, receipt.currency || currency)}
              </div>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-xs">
            <div className="space-y-1">
              <span className="text-brand-muted uppercase font-bold text-[10px]">Purchase Date</span>
              <div className="flex items-center gap-1.5 font-semibold text-brand-navy">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(receipt.purchase_date)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-brand-muted uppercase font-bold text-[10px]">Payment Method</span>
              <div className="flex items-center gap-1.5 font-semibold text-brand-navy">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{receipt.payment_method || "Recorded"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-brand-muted uppercase font-bold text-[10px]">Document Type</span>
              <div className="flex items-center gap-1.5 font-semibold text-brand-navy">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{receipt.document_type || "Tax Invoice"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-brand-muted uppercase font-bold text-[10px]">Warranty / Guarantee</span>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{receipt.warranty_duration || "None stated"}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-muted">
              Purchased Line Items
            </h3>

            <div className="border border-brand-border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-brand-border font-bold text-brand-muted uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.items?.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-brand-navy">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {item.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(item.unit_price, receipt.currency || currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-navy">
                        {formatCurrency(item.total_price, receipt.currency || currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(receipt.subtotal || 0, receipt.currency || currency)}</span>
              </div>
              {receipt.tax > 0 && (
                <div className="flex justify-between text-brand-muted">
                  <span>Taxes (GST)</span>
                  <span className="font-mono">{formatCurrency(receipt.tax, receipt.currency || currency)}</span>
                </div>
              )}
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(receipt.discount, receipt.currency || currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-brand-navy pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-brand-blue">
                  {formatCurrency(receipt.grand_total, receipt.currency || currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Editing Save Controls */}
          {editing && (
            <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5 text-brand-green" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
