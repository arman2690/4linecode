"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import {
  Coins,
  Bell,
  Download,
  Shield,
  Save,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [currency, setCurrency] = useState("INR");
  const [warrantyAlerts, setWarrantyAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("receiptiq_currency");
    if (saved) setCurrency(saved);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("receiptiq_currency", currency);
    window.dispatchEvent(new Event("currencyChanged"));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = async () => {
    try {
      const receipts = await api.getReceipts();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipts, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `receiptiq_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert("Failed to export records");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Configure currency display, warranty reminders, and export your digital purchase records
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-brand-border shadow-subtle p-6 sm:p-8 space-y-8">
          {/* Currency Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Coins className="w-5 h-5 text-brand-blue" />
              <div>
                <h3 className="text-base font-bold text-brand-navy">Primary Currency Display</h3>
                <p className="text-xs text-brand-muted">Used for financial summaries, analytics, and receipt values</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { code: "INR", symbol: "₹", name: "Indian Rupee" },
                { code: "USD", symbol: "$", name: "US Dollar" },
                { code: "EUR", symbol: "€", name: "Euro" },
                { code: "GBP", symbol: "£", name: "British Pound" },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    currency === c.code
                      ? "border-brand-blue bg-blue-50/50 shadow-subtle"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl font-black block font-mono text-brand-navy">{c.symbol}</span>
                  <span className="text-xs font-bold text-brand-navy block mt-1">{c.code}</span>
                  <span className="text-[11px] text-brand-muted block">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Warranty Reminder Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Bell className="w-5 h-5 text-brand-yellow" />
              <div>
                <h3 className="text-base font-bold text-brand-navy">Warranty Notifications</h3>
                <p className="text-xs text-brand-muted">Automatic reminders before your warranties and service periods expire</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-brand-navy">Advance Expiry Alerts</p>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  Highlight items expiring within 30 days on your dashboard and alerts feed
                </p>
              </div>
              <input
                type="checkbox"
                checked={warrantyAlerts}
                onChange={(e) => setWarrantyAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-blue rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Export Data Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Download className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-brand-navy">Export Purchase Records</h3>
                <p className="text-xs text-brand-muted">Download all parsed metadata, line items, and store transactions in JSON format</p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-brand-navy font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Vault JSON (.json)</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-brand-border flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-subtle hover:shadow-card transition-all text-xs"
            >
              <Save className="w-4 h-4 text-brand-green" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
