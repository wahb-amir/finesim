"use client";

import Link from "next/link";

export function Breadcrumb({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-2 text-[13px]"
    >
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 ? <span className="text-[#4A4A4A]">/</span> : null}
          {item.href ? (
            <Link
              href={item.href}
              className="text-[#6B6B6B] transition hover:text-[#F59E0B]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[#F5F5F5]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
