"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Wallet,
  Receipt as ReceiptIcon,
  TrendingUp,
  CreditCard,
  ScanLine,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

const CATEGORY_COLORS = ["#14213D", "#4568DC", "#16A34A", "#EAB308", "#9333EA", "#06B6D4", "#F97316"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    total_spending_current_month: 0,
    total_spending_previous_month: 0,
    percentage_change: 0,
    receipts_count: 0,
    average_purchase_value: 0,
    total_lifetime_spending: 0,
    currency: "INR"
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [currency, setCurrency] = useState("INR");

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const activeCurrency = localStorage.getItem("receiptiq_currency") || "INR";
      setCurrency(activeCurrency);

      const [sumRes, timeRes, catRes, recRes] = await Promise.all([
        api.getSummary(activeCurrency).catch(() => null),
        api.getSpendingTimeline(14).catch(() => []),
        api.getCategories().catch(() => []),
        api.getReceipts().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      if (Array.isArray(timeRes)) setTimeline(timeRes);
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(recRes)) setRecentReceipts(recRes.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleCurrencyEvent = () => loadDashboardData();
    window.addEventListener("currencyChanged", handleCurrencyEvent);
    return () => window.removeEventListener("currencyChanged", handleCurrencyEvent);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Financial Overview
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Your real-time purchase metrics and itemized expense intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-subtle hover:shadow-card transition-all text-sm"
            >
              <ScanLine className="w-4 h-4 text-brand-green" />
              <span>Scan New Receipt</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Spending Month */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                This Month's Spending
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-navy tracking-tight font-mono">
                {formatCurrency(summary.total_spending_current_month, currency)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {summary.percentage_change >= 0 ? (
                  <span className="text-amber-600 font-bold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{summary.percentage_change}%
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" /> {summary.percentage_change}%
                  </span>
                )}
                <span className="text-slate-400">vs last month</span>
              </div>
            </div>
          </div>

          {/* Card 2: Receipts Count */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                Logged Receipts
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                <ReceiptIcon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-navy tracking-tight font-mono">
                {summary.receipts_count}
              </div>
              <p className="text-xs text-brand-muted mt-1">
                Total documents in your vault
              </p>
            </div>
          </div>

          {/* Card 3: Average Purchase Value */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                Average Basket Size
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-navy tracking-tight font-mono">
                {formatCurrency(summary.average_purchase_value, currency)}
              </div>
              <p className="text-xs text-brand-muted mt-1">
                Per verified purchase
              </p>
            </div>
          </div>

          {/* Card 4: Lifetime Total */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                Lifetime Recorded
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-brand-yellow flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-navy tracking-tight font-mono">
                {formatCurrency(summary.total_lifetime_spending, currency)}
              </div>
              <p className="text-xs text-brand-muted mt-1">
                Across all recorded history
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Spending Trend Chart */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-brand-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-brand-navy">Daily Spending Trend</h3>
                <p className="text-xs text-brand-muted">Past 14 days activity</p>
              </div>
              <Link href="/analytics" className="text-xs font-semibold text-brand-blue hover:underline">
                View Full Analytics
              </Link>
            </div>

            <div className="h-64 w-full pt-4">
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(5)}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, "Spent"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: "#14213D", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="amount" fill="#4568DC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-brand-muted">
                  No purchases recorded in this date range.
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown Donut */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-brand-border shadow-subtle space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-navy">Category Share</h3>
              <p className="text-xs text-brand-muted">Where your money goes</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center my-2">
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categories}
                      dataKey="total_amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, "Total"]}
                      contentStyle={{ backgroundColor: "#14213D", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-brand-muted">No items categorized yet</div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
              {categories.slice(0, 4).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[120px]">{cat.category}</span>
                  </div>
                  <span className="font-mono font-bold text-brand-navy">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Purchases Vault Table */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-subtle overflow-hidden">
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-navy">Recent Purchases</h3>
              <p className="text-xs text-brand-muted">Latest verified documents saved to your vault</p>
            </div>
            <Link
              href="/receipts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              <span>View all receipts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-brand-muted uppercase tracking-wider border-b border-brand-border">
                  <tr>
                    <th className="py-3 px-6">Merchant & Invoice</th>
                    <th className="py-3 px-6">Purchase Date</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Amount</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReceipts.map((r) => {
                    const primaryCat = r.items?.[0]?.category || "General";
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-brand-navy">{r.merchant_name}</div>
                          <div className="text-xs text-brand-muted font-mono">{r.invoice_number || "No Inv #"}</div>
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-600">
                          {formatDate(r.purchase_date)}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {primaryCat}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <StatusBadge status={r.document_status || "GREEN"} reason={r.document_status_reason} />
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-brand-navy">
                          {formatCurrency(r.grand_total, r.currency || currency)}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <Link
                            href={`/receipts/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-brand-navy transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ReceiptIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-brand-navy">No receipts logged yet</h4>
                <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1">
                  Upload your first paper receipt photo or digital PDF invoice to unlock automated analytics and warranty tracking.
                </p>
              </div>
              <Link
                href="/upload"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-navy text-white px-4 py-2 rounded-xl"
              >
                <ScanLine className="w-4 h-4 text-brand-green" />
                <span>Upload First Receipt</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
