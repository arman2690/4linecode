"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  Plus,
  Receipt,
  ChevronRight,
  Trash2,
  Calendar,
  Building,
  Tag,
  Download
} from "lucide-react";

export default function AllReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currency, setCurrency] = useState("INR");

  const categories = [
    "All",
    "Electronics",
    "Groceries",
    "Food and beverages",
    "Clothing",
    "Healthcare",
    "Transportation",
    "Education",
    "Entertainment",
    "Household",
    "Other",
  ];

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const activeCurr = localStorage.getItem("receiptiq_currency") || "INR";
      setCurrency(activeCurr);
      const catParam = selectedCategory === "All" ? undefined : selectedCategory;
      const data = await api.getReceipts(search, catParam);
      setReceipts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this receipt? This will also remove any linked warranty records.")) {
      try {
        await api.deleteReceipt(id);
        setReceipts(receipts.filter((r) => r.id !== id));
      } catch (err) {
        alert("Failed to delete receipt");
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Digital Purchase Vault
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Search and filter your entire digital purchase history
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-subtle hover:shadow-card transition-all text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-brand-green" />
            <span>Upload Receipt</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant, product name, or invoice number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-brand-navy focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Receipts List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-brand-muted">
            Loading your vault...
          </div>
        ) : receipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {receipts.map((r) => {
              const primaryCategory = r.items?.[0]?.category || "Other";
              return (
                <Link
                  key={r.id}
                  href={`/receipts/${r.id}`}
                  className="bg-white rounded-2xl border border-brand-border p-5 shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-brand-navy truncate group-hover:text-brand-blue transition-colors">
                          {r.merchant_name}
                        </h3>
                        <p className="text-xs text-brand-muted font-mono truncate">
                          {r.invoice_number || "No Invoice #"}
                        </p>
                      </div>
                      <StatusBadge status={r.document_status || "GREEN"} reason={r.document_status_reason} />
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(r.purchase_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{primaryCategory}</span>
                        {r.items?.length > 1 && (
                          <span className="text-[10px] text-brand-muted">
                            +{r.items.length - 1} more items
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-muted block">
                        Total Amount
                      </span>
                      <span className="text-base font-black font-mono text-brand-navy">
                        {formatCurrency(r.grand_total, r.currency || currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(r.id, e)}
                        title="Delete Receipt"
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1.5 text-brand-blue group-hover:translate-x-0.5 transition-transform">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-brand-navy">No matching receipts</h3>
              <p className="text-xs text-brand-muted mt-1">
                Try adjusting your search keywords or upload a new invoice.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
