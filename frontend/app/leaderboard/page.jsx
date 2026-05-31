"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { fetchLeaderboard } from "@/lib/api";

function LeaderboardContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const entries = await fetchLeaderboard();
      setLeaderboard(entries);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
      return;
    }
    if (user) loadLeaderboard();
  }, [authLoading, user, router, loadLeaderboard]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <AppNavbar />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-[#F59E0B]">
          <div className="text-center">
            <div className="mb-3 text-2xl">Loading leaderboard…</div>
            <div className="text-sm text-[#6B6B6B]">
              Fetching top simulation scores
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-16">
      <AppNavbar />

      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-[0.06] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, #F59E0B, transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-10 relative z-10">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Leaderboard" },
          ]}
        />

        <div className="flex items-start justify-between mb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium mb-3"
              style={{
                background: "rgba(245,158,11,0.05)",
                borderColor: "rgba(245,158,11,0.2)",
                color: "#F59E0B",
              }}
            >
              🏆 ALL-TIME LEADERBOARD
            </div>
            <h1
              className="text-3xl font-extrabold text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Top Simulators
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-1">
              Ranked by each player&apos;s best completed run
            </p>
          </div>
          <button
            onClick={() => router.push("/setup")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            style={{
              background: "#F59E0B",
              color: "#0A0A0A",
              fontFamily: "var(--font-display)",
            }}
          >
            New Simulation
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadLeaderboard();
              }}
              className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2A2A2A] bg-[#111111] py-16 text-center">
            <div className="mb-4 text-4xl">🏆</div>
            <h2 className="text-xl font-bold text-[#F5F5F5]">No scores yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
              Complete a simulation to appear on the leaderboard. Your best run
              counts toward your rank.
            </p>
            <button
              type="button"
              onClick={() => router.push("/setup")}
              className="mt-6 rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
            >
              Start a Simulation
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[40px_1fr_100px_100px_90px] gap-3 px-4 mb-2">
              {["#", "Player", "Net Worth", "Credit", "Score"].map((h) => (
                <div
                  key={h}
                  className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-medium"
                >
                  {h}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] overflow-hidden">
              {leaderboard.map((player) => {
                const isCurrentPlayer = player.isCurrentPlayer;
                const isTop3 = player.rank <= 3;

                return (
                  <div
                    key={`${player.rank}-${player.userId}`}
                    className="grid grid-cols-[40px_1fr_100px_100px_90px] gap-3 items-center px-4 py-3.5 border-b last:border-b-0 transition-colors"
                    style={{
                      borderColor: "#1A1A1A",
                      background: isCurrentPlayer
                        ? "rgba(245,158,11,0.05)"
                        : "transparent",
                      borderLeft: isCurrentPlayer
                        ? "2px solid rgba(245,158,11,0.4)"
                        : "2px solid transparent",
                    }}
                    aria-current={isCurrentPlayer ? "true" : undefined}
                  >
                    <div>
                      {isTop3 ? (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                          style={{
                            background:
                              player.rank === 1
                                ? "rgba(245,158,11,0.15)"
                                : player.rank === 2
                                  ? "rgba(161,161,161,0.12)"
                                  : "rgba(180,100,40,0.12)",
                            color:
                              player.rank === 1
                                ? "#F59E0B"
                                : player.rank === 2
                                  ? "#A1A1A1"
                                  : "#B46428",
                            border: `1px solid ${
                              player.rank === 1
                                ? "rgba(245,158,11,0.3)"
                                : player.rank === 2
                                  ? "rgba(161,161,161,0.25)"
                                  : "rgba(180,100,40,0.25)"
                            }`,
                          }}
                        >
                          {player.rank}
                        </div>
                      ) : (
                        <span
                          className="text-[13px] font-medium pl-2"
                          style={{
                            color: isCurrentPlayer ? "#F59E0B" : "#4A4A4A",
                          }}
                        >
                          {player.rank}
                        </span>
                      )}
                    </div>

                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color: isCurrentPlayer ? "#F59E0B" : "#F5F5F5",
                        fontFamily: isTop3 ? "var(--font-display)" : "inherit",
                      }}
                    >
                      {isCurrentPlayer ? `${player.name} (You)` : player.name}
                    </div>

                    <div
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color: player.netWorth >= 0 ? "#10B981" : "#EF4444",
                      }}
                    >
                      ${player.netWorth.toLocaleString()}
                    </div>

                    <div
                      className="text-sm font-medium tabular-nums"
                      style={{
                        color:
                          player.creditScore >= 700
                            ? "#10B981"
                            : player.creditScore >= 600
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {player.creditScore}
                    </div>

                    <div className="text-sm font-bold text-[#F5F5F5] tabular-nums">
                      {player.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-4 text-[11px] text-[#4A4A4A]">
              <span>Score = (Net Worth ÷ 8) + (Credit Score × 2)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
