import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className = "", size = "md", href = "/" }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Receipt-inspired icon with subtle smart AI node */}
      <div className={`relative flex items-center justify-center rounded-xl bg-brand-navy text-white shadow-subtle ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/6 h-5/6"
        >
          {/* Receipt outline with zigzag bottom */}
          <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z" />
          {/* Data item lines */}
          <line x1="8" y1="6" x2="16" y2="6" stroke="#4568DC" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="13" y2="14" />
        </svg>
        {/* Intelligence green dot indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-green ring-2 ring-white"></span>
      </div>

      <div className={`flex items-center ${textSizes[size]}`}>
        <span className="text-brand-navy font-extrabold tracking-tight">Receipt</span>
        <span className="text-brand-blue font-black">IQ</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
