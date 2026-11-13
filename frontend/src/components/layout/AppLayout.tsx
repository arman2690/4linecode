"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  LayoutDashboard,
  ScanLine,
  Receipt,
  ShieldCheck,
  PieChart,
  History,
  Bot,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Coins,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [userEmail, setUserEmail] = useState("demo@receiptiq.local");
  const [userName, setUserName] = useState("Demo User");

  useEffect(() => {
    // Check saved user info or currency preference
    const savedUser = localStorage.getItem("receiptiq_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.email) setUserEmail(u.email);
        if (u.full_name) setUserName(u.full_name);
        if (u.currency) setSelectedCurrency(u.currency);
      } catch {}
    }

    const savedCurr = localStorage.getItem("receiptiq_currency");
    if (savedCurr) {
      setSelectedCurrency(savedCurr);
    }
  }, []);

  const handleCurrencyChange = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    localStorage.setItem("receiptiq_currency", newCurr);
    // Dispatch custom event so pages update live
    window.dispatchEvent(new Event("currencyChanged"));
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("receiptiq_user");
    localStorage.removeItem("receiptiq_token");
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scan Receipt", href: "/upload", icon: ScanLine, highlight: true },
    { name: "All Receipts", href: "/receipts", icon: Receipt },
    { name: "Expense Analytics", href: "/analytics", icon: PieChart },
    { name: "Warranty Manager", href: "/warranties", icon: ShieldCheck },
    { name: "Purchase History", href: "/history", icon: History },
    { name: "Ask ReceiptIQ", href: "/assistant", icon: Bot, badge: "AI" },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-brand-border select-none fixed inset-y-0 z-30">
        <div className="p-6 border-b border-brand-border">
          <Logo size="md" />
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <Link
            href="/upload"
            className="w-full flex items-center justify-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-subtle hover:shadow-card transition-all text-sm"
          >
            <PlusCircle className="w-4 h-4 text-brand-green" />
            <span>Upload Receipt</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-slate-100 text-brand-navy font-bold shadow-subtle"
                    : "text-brand-muted hover:text-brand-navy hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-blue" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-100">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-brand-border bg-slate-50/50">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-navy truncate">{userName}</p>
                <p className="text-[11px] text-brand-muted truncate">{userEmail}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-brand-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-brand-navy hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="lg:hidden">
              <Logo size="sm" />
            </div>

            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-brand-muted">
                ReceiptIQ Workspace
              </h2>
            </div>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-brand-navy">
              <Coins className="w-3.5 h-3.5 text-brand-blue" />
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Quick Scan</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-72 max-w-[80vw] h-full bg-white flex flex-col shadow-2xl p-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                <Logo size="md" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-slate-100 text-brand-navy font-bold"
                          : "text-brand-muted hover:text-brand-navy hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-brand-blue" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-bold text-brand-navy">{userName}</p>
                  <p className="text-brand-muted">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
