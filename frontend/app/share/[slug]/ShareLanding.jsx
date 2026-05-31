"use client";

import Link from "next/link";
import ShareCard from "@/components/share/ShareCard";

export default function ShareLanding({ card, url }) {
  const positive = card?.isPositive ?? (card?.netWorth ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div
        className="fixed top-0 left-0 right-0 h-72 pointer-events-none opacity-25"
        style={{
          background: positive
            ? "radial-gradient(ellipse at center top, #10B981, transparent 70%)"
            : "radial-gradient(ellipse at center top, #EF4444, transparent 70%)",
        }}
      />

      <div className="max-w-lg mx-auto px-4 pt-10 relative z-10">
        <p className="text-center text-[11px] uppercase tracking-[0.25em] text-[#F59E0B] mb-6">
          FinSim result card
        </p>

        <ShareCard card={card} className="share-card-landing mb-8" />

        <div className="text-center space-y-6">
          <p className="text-[#A1A1A1] text-sm leading-relaxed max-w-sm mx-auto">
            <span className="text-[#F5F5F5] font-medium">{card.playerName}</span>{" "}
            simulated 10 years of money decisions in FinSim. Think you can beat
            their run?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "#F59E0B",
                color: "#0A0A0A",
                fontFamily: "var(--font-display)",
                boxShadow: "0 0 30px rgba(245,158,11,0.2)",
              }}
            >
              Play your own run
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-sm border"
              style={{
                borderColor: "#2A2A2A",
                color: "#A1A1A1",
                background: "#111111",
                fontFamily: "var(--font-display)",
              }}
            >
              What is FinSim?
            </Link>
          </div>

          {url ? (
            <p className="text-[10px] text-[#6B6B6B] break-all">{url}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
