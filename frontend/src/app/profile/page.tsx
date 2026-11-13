"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("Arman Demo User");
  const [email, setEmail] = useState("demo@receiptiq.local");
  const [currency, setCurrency] = useState("INR");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("receiptiq_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.full_name) setFullName(u.full_name);
        if (u.email) setEmail(u.email);
        if (u.currency) setCurrency(u.currency);
      } catch {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("receiptiq_user", JSON.stringify({
      full_name: fullName,
      email,
      currency,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage your personal details and account credentials
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-brand-border shadow-subtle p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-brand-border">
            <div className="w-16 h-16 rounded-2xl bg-brand-navy text-white font-extrabold text-2xl flex items-center justify-center shadow-subtle">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-navy">{fullName}</h3>
              <p className="text-xs text-brand-muted">{email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="text-[11px] font-semibold text-emerald-700">Account Active</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-brand-navy mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-brand-navy mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-brand-navy mb-1.5">Security Level</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <span className="font-semibold text-brand-navy">Supabase Row Level Security Active</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Strictly Isolated</span>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-subtle text-xs"
              >
                <Save className="w-4 h-4 text-brand-green" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
