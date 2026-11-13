"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  Tag,
  X
} from "lucide-react";

export default function WarrantyManagerPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New warranty form
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [duration, setDuration] = useState("1 Year");
  const [expiryDate, setExpiryDate] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const data = await api.getWarranties();
      setWarranties(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createWarranty({
        product_name: productName,
        brand,
        purchase_date: purchaseDate,
        warranty_duration: duration,
        expiry_date: expiryDate,
        serial_number: serialNumber,
        notes,
      });
      setModalOpen(false);
      // Reset form
      setProductName("");
      setBrand("");
      setPurchaseDate("");
      setExpiryDate("");
      setSerialNumber("");
      setNotes("");
      fetchWarranties();
    } catch (err) {
      alert("Failed to create warranty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this warranty record?")) {
      try {
        await api.deleteWarranty(id);
        setWarranties(warranties.filter((w) => w.id !== id));
      } catch (err) {
        alert("Failed to delete warranty");
      }
    }
  };

  const activeCount = warranties.filter((w) => w.status === "ACTIVE").length;
  const expiringCount = warranties.filter((w) => w.status === "EXPIRING_SOON").length;
  const expiredCount = warranties.filter((w) => w.status === "EXPIRED").length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Warranty Manager
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Active guarantees, expiration countdowns, and claim documentation
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-subtle hover:shadow-card transition-all text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-brand-green" />
            <span>Add Warranty</span>
          </button>
        </div>

        {/* 3 Status Summary Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Active Guarantees
              </span>
              <span className="text-2xl font-black text-brand-navy">{activeCount}</span>
              <p className="text-xs text-brand-muted mt-0.5">&gt; 30 days protection remaining</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Expiring Soon
              </span>
              <span className="text-2xl font-black text-brand-navy">{expiringCount}</span>
              <p className="text-xs text-brand-muted mt-0.5">Expires within next 30 days</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-brand-yellow flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Expired
              </span>
              <span className="text-2xl font-black text-brand-navy">{expiredCount}</span>
              <p className="text-xs text-brand-muted mt-0.5">Past warranty validity window</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Warranties Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-brand-muted">Loading warranties...</div>
        ) : warranties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {warranties.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-brand-border p-5 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-brand-navy truncate">
                        {w.product_name}
                      </h3>
                      <p className="text-xs text-brand-muted font-medium">
                        {w.brand || "Manufacturer"} • {w.warranty_duration || "Standard"}
                      </p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Purchased:</span>
                      <span className="font-semibold text-brand-navy">{formatDate(w.purchase_date)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Expires On:</span>
                      <span className="font-semibold text-brand-navy">{formatDate(w.expiry_date)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-brand-muted">Remaining Time:</span>
                      <span className={`font-mono font-bold ${
                        w.status === "ACTIVE" ? "text-emerald-700" : w.status === "EXPIRING_SOON" ? "text-amber-700" : "text-slate-400"
                      }`}>
                        {w.days_remaining > 0 ? `${w.days_remaining} days left` : "Expired"}
                      </span>
                    </div>

                    {w.serial_number && (
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                        <span>Serial #:</span>
                        <span>{w.serial_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {w.receipt_id ? (
                    <Link
                      href={`/receipts/${w.receipt_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Manual Entry</span>
                  )}

                  <button
                    onClick={() => handleDelete(w.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-brand-navy">No warranties tracked yet</h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1">
                Upload receipts with explicit warranty coverage or manually log guarantees to receive expiration alerts.
              </p>
            </div>
          </div>
        )}

        {/* Modal for Manual Warranty Entry */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <h3 className="text-lg font-bold text-brand-navy">Add New Warranty Record</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-brand-navy mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. MacBook Pro 14, Sony WH-1000XM5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-brand-navy mb-1">Brand / Manufacturer</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Apple, Sony"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-brand-navy mb-1">Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 1 Year, 2 Years"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-brand-navy mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-brand-navy mb-1">Expiration Date *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-brand-navy mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-889102-X"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-brand-navy mb-1">Coverage Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Includes accidental damage and battery replacement"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-brand-navy text-white font-semibold shadow-subtle"
                  >
                    {submitting ? "Saving..." : "Save Warranty"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
