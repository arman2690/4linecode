"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  History,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  ChevronRight,
  Info,
  Calendar,
  Building
} from "lucide-react";

export default function PurchaseHistoryPage() {
  const [intel, setIntel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const activeCurr = localStorage.getItem("receiptiq_currency") || "INR";
      setCurrency(activeCurr);
      const data = await api.getPriceIntelligence();
      setIntel(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = intel.filter((item) =>
    item.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Purchase History & Price Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Track price variations and historical payments for items you buy repeatedly
            </p>
          </div>
        </div>

        {/* Disclaimer Note (as requested in specifications) */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Price Intelligence Notice: </span>
            Comparisons are calculated strictly from your personal saved purchase records. Historical prices paid do not represent real-time external market prices or current retailer listings.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search historical products (e.g. Headphones, Milk, Bread)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </div>

        {/* Comparison Cards */}
        {loading ? (
          <div className="p-12 text-center text-xs text-brand-muted">
            Analyzing purchase records...
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-brand-border p-6 shadow-subtle space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-brand-navy">
                      {item.product_name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Purchased {item.purchase_count} time{item.purchase_count > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Trend Indicator */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.price_trend === "DECREASING"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : item.price_trend === "INCREASING"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {item.price_trend === "DECREASING" && <TrendingDown className="w-3.5 h-3.5" />}
                    {item.price_trend === "INCREASING" && <TrendingUp className="w-3.5 h-3.5" />}
                    {item.price_trend === "STABLE" && <Minus className="w-3.5 h-3.5" />}
                    <span>{item.price_trend}</span>
                  </span>
                </div>

                {/* Price Metrics Triplets */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Lowest Paid
                    </span>
                    <span className="text-base font-black font-mono text-emerald-800">
                      {formatCurrency(item.lowest_price, currency)}
                    </span>
                  </div>

                  <div className="border-x border-slate-200">
                    <span className="text-[10px] font-bold text-brand-muted uppercase block">
                      Average Price
                    </span>
                    <span className="text-base font-black font-mono text-brand-navy">
                      {formatCurrency(item.average_price, currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Highest Paid
                    </span>
                    <span className="text-base font-black font-mono text-rose-800">
                      {formatCurrency(item.highest_price, currency)}
                    </span>
                  </div>
                </div>

                {/* Recent Purchases List */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                    Historical Purchases Log
                  </span>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                    {item.purchases?.map((p: any, i: number) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{p.merchant}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({formatDate(p.date)})</span>
                        </div>
                        <span className="font-mono font-bold text-brand-navy">
                          {formatCurrency(p.unit_price, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-3">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-brand-navy">No purchase history yet</h4>
            <p className="text-xs text-brand-muted">
              Upload more receipts to start comparing repeat purchases.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
