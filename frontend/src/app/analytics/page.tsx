"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  PieChart as PieIcon,
  TrendingUp,
  Calendar,
  Layers,
  Coins,
  ArrowUpRight,
  ArrowDownRight
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
  Cell,
  Legend
} from "recharts";

const COLORS = ["#14213D", "#4568DC", "#16A34A", "#EAB308", "#9333EA", "#06B6D4", "#F97316", "#EC4899", "#84CC16"];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_spending_current_month: 0,
    total_lifetime_spending: 0,
    average_purchase_value: 0,
    receipts_count: 0
  });
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const activeCurr = localStorage.getItem("receiptiq_currency") || "INR";
      setCurrency(activeCurr);

      const [sum, cats, time] = await Promise.all([
        api.getSummary(activeCurr).catch(() => null),
        api.getCategories().catch(() => []),
        api.getSpendingTimeline(days).catch(() => []),
      ]);

      if (sum) setSummary(sum);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(time)) setTimeline(time);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Expense Analytics
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Visualize spending trends, category distributions, and monthly velocity
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-brand-border p-1 rounded-xl shadow-subtle text-xs font-semibold">
            {[
              { label: "14 Days", val: 14 },
              { label: "30 Days", val: 30 },
              { label: "90 Days", val: 90 },
              { label: "1 Year", val: 365 },
            ].map((period) => (
              <button
                key={period.val}
                onClick={() => setDays(period.val)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  days === period.val
                    ? "bg-brand-navy text-white shadow-subtle"
                    : "text-brand-muted hover:text-brand-navy"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-1">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              Selected Period Spending
            </span>
            <div className="text-2xl font-black font-mono text-brand-navy">
              {formatCurrency(
                timeline.reduce((acc, curr) => acc + (curr.amount || 0), 0),
                currency
              )}
            </div>
            <p className="text-xs text-brand-muted">Across last {days} days</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-1">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              Top Expense Category
            </span>
            <div className="text-2xl font-black text-brand-navy">
              {categories[0]?.category || "None"}
            </div>
            <p className="text-xs text-brand-muted">
              {categories[0] ? `${categories[0].percentage}% of total spending` : "No purchases yet"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-subtle space-y-1">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              Average Transaction Size
            </span>
            <div className="text-2xl font-black font-mono text-brand-navy">
              {formatCurrency(summary.average_purchase_value, currency)}
            </div>
            <p className="text-xs text-brand-muted">Across all {summary.receipts_count} receipts</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Spending Timeline */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-brand-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-brand-navy">Spending Velocity</h3>
                <p className="text-xs text-brand-muted">Daily distribution over {days} days</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
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
                  No data available for this range
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution Donut */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-brand-border shadow-subtle space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-navy">Category Allocation</h3>
              <p className="text-xs text-brand-muted">Proportional breakdown by item category</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center my-2">
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categories}
                      dataKey="total_amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, "Total"]}
                      contentStyle={{ backgroundColor: "#14213D", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-brand-muted">No items found</div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto">
              {categories.map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-brand-muted">
                      {formatCurrency(cat.total_amount, currency)}
                    </span>
                    <span className="font-bold text-brand-navy w-10 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
