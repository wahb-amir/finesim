"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "../context/AuthContext";
import DebriefView from "@/components/debrief/DebriefView";

const API = process.env.NEXT_PUBLIC_API_URL;

function DebriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { user, loading: authLoading } = useAuth();
  const {
    playerName,
    metrics,
    debriefData,
    setDebriefData,
    resetGame,
    scenarioId,
    hydrateGameView,
  } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!sessionId || authLoading || !user) return;

    let cancelled = false;

    const loadDebrief = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/game/session/${sessionId}/debrief`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load debrief");
        }

        if (cancelled) return;

        setDebriefData(data.debrief);
        setServerMetrics(data.metrics);
        if (data.metrics) {
          hydrateGameView({ metrics: data.metrics });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load debrief");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDebrief();
    return () => {
      cancelled = true;
    };
  }, [sessionId, authLoading, user, setDebriefData, hydrateGameView]);

  const debrief = debriefData;
  const displayMetrics = serverMetrics || metrics;
  const netWorth =
    displayMetrics?.netWorth ?? debrief?.finalMetrics?.netWorth ?? 0;

  const handleShare = () => {
    const text =
      debrief?.shareText ||
      `FinSim Result — ${playerName || debrief?.playerName || "Player"}\nNet Worth: $${netWorth.toLocaleString()}\nCredit Score: ${displayMetrics?.creditScore ?? "—"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlayAgain = () => {
    resetGame();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("gameSessionId");
      sessionStorage.removeItem("finsimReplay");
    }
    router.push("/setup");
  };

  const handleReplayMoment = (mistake) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "finsimReplay",
        JSON.stringify({
          round: mistake.round,
          mistakeId: mistake.id,
          label: mistake.label,
          eventTitle: mistake.eventTitle,
          fromSessionId: sessionId,
        }),
      );
      window.localStorage.removeItem("gameSessionId");
    }
    resetGame();
    const q = mistake.round ? `?replayRound=${mistake.round}` : "";
    router.push(`/setup${q}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-1" />
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-2" />
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-3" />
          </div>
          <p className="text-[#6B6B6B] text-sm">
            Building your financial debrief…
          </p>
        </div>
      </div>
    );
  }

  if (error || !debrief) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || "Debrief unavailable"}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl border border-[#2A2A2A] text-[#A1A1A1] font-semibold text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPositive = netWorth >= 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none opacity-20"
        style={{
          background: isPositive
            ? "radial-gradient(ellipse at center top, #10B981, transparent 70%)"
            : "radial-gradient(ellipse at center top, #EF4444, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 pt-12 relative z-10">
        <DebriefView
          debrief={debrief}
          displayMetrics={displayMetrics}
          playerName={playerName}
          scenarioId={scenarioId}
          showActions
          onPlayAgain={handlePlayAgain}
          onReplayMoment={handleReplayMoment}
          onDashboard={() => router.push("/dashboard")}
          onShare={handleShare}
          copied={copied}
        />
      </div>
    </div>
  );
}

export default function DebriefPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#6B6B6B]">
          Loading debrief...
        </div>
      }
    >
      <DebriefContent />
    </Suspense>
  );
}
