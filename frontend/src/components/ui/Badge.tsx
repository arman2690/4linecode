import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "GREEN" | "YELLOW" | "RED" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  reason?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, reason, showIcon = true }: StatusBadgeProps) {
  const configs = {
    GREEN: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Verified Quality",
      icon: CheckCircle2,
    },
    ACTIVE: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Active Warranty",
      icon: CheckCircle2,
    },
    YELLOW: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      label: "Needs Review",
      icon: AlertTriangle,
    },
    EXPIRING_SOON: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      label: "Expiring Soon",
      icon: Clock,
    },
    RED: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      label: "Manual Check Required",
      icon: AlertCircle,
    },
    EXPIRED: {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
      label: "Expired",
      icon: AlertCircle,
    },
  };

  const config = configs[status] || configs.YELLOW;
  const Icon = config.icon;

  return (
    <span
      title={reason || config.label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {category}
    </span>
  );
}
