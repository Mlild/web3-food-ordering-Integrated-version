"use client";

import Link from "next/link";
import { type ReactNode } from "react";

export function BrandHomeLink({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/member"
      className="inline-flex items-center gap-2 rounded-full border border-[rgba(125,68,29,0.1)] bg-white/72 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_24px_rgba(76,49,28,0.06)] transition duration-200 hover:bg-white"
    >
      {children}
    </Link>
  );
}
