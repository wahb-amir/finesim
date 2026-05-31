"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/app/context/AuthContext";
import { AdvisorPanel } from "@/components/ui/AdvisorPanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameLoadingScreen } from "@/components/game/GameLoadingScreen";
import { GameToast } from "@/components/game/GameToast";
import { GameHeader } from "@/components/game/GameHeader";
import { GameMetricsSidebar } from "@/components/game/GameMetricsSidebar";
import { GameRoundPanel } from "@/components/game/GameRoundPanel";
import { GameFooter } from "@/components/game/GameFooter";
import { useGameSession } from "@/hooks/useGameSession";
import { TOTAL_ROUNDS, API } from "@/components/game/constants";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function GameContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const {
    playerName,
    setPlayerName,
    setGoal,
    hydrateGameView,
    selectChoice,
    recordRoundSnapshot,
    setDebriefData,
    currentRound,
    metrics,
    selectedChoice,
    currentEvent,
    ageYears,
  } = useGame();

  const routeSessionId =
    typeof params?.sessionId === "string" ? params.sessionId : null;
  const querySessionId = searchParams.get("sessionId");

  const [isConfirming, setIsConfirming] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [crisisFlash, setCrisisFlash] = useState(false);
  const [advisorState, setAdvisorState] = useState({
    advisorMessages: [],
    advisorCallsUsed: 0,
  });

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const { sessionId, session, loadingSession } = useGameSession({
    routeSessionId,
    querySessionId,
    authLoading,
    user,
    router,
    hydrateGameView,
    setPlayerName,
    setGoal,
    showToast,
  });

  useEffect(() => {
    if (!session) return;
    setAdvisorState({
      advisorMessages: session.advisorMessages || [],
      advisorCallsUsed: session.advisorCallsUsed || 0,
    });
  }, [session]);

  const handleAdvisorUpdate = useCallback((payload) => {
    setAdvisorState({
      advisorMessages: payload.advisorMessages || [],
      advisorCallsUsed: payload.advisorCallsUsed || 0,
    });
  }, []);

  const userName = user?.name || session?.playerName || playerName || "Player";

  const roundData = useMemo(() => {
    if (!currentEvent) return null;
    const displayAge = Math.max(18, Math.floor(ageYears));
    return {
      year: `Age ${displayAge}`,
      title: currentEvent.title,
      description: currentEvent.description,
      choices: [currentEvent.left, currentEvent.right],
      isCrisis: currentEvent.crisis,
    };
  }, [currentEvent, ageYears]);

  const isCrisis = roundData?.isCrisis || false;
  const remainingRounds = Math.max(
    0,
    TOTAL_ROUNDS - Math.min(currentRound, TOTAL_ROUNDS) + 1,
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (currentRound !== 4 && currentRound !== 8) return;
    setCrisisFlash(true);
    const timer = setTimeout(() => setCrisisFlash(false), 200);
    return () => clearTimeout(timer);
  }, [currentRound]);

  const handleConfirm = useCallback(async () => {
    if (
      !selectedChoice ||
      isConfirming ||
      savingRound ||
      !currentEvent ||
      !sessionId
    ) {
      return;
    }

    setIsConfirming(true);
    setSavingRound(true);

    try {
      const res = await fetch(`${API}/game/session/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          choice: selectedChoice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to submit round");
      }

      recordRoundSnapshot({
        round: currentRound,
        choice: selectedChoice,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        metricSnapshot: { ...metrics },
      });

      if (data.completed || data.status === "completed") {
        setDebriefData(null);
        router.push(`/debrief?sessionId=${sessionId}`);
        return;
      }

      hydrateGameView({
        currentRound: data.currentRound,
        metrics: data.metrics,
        event: data.event,
        narrative: data.narrative,
        debrief: data.debrief,
        ageYears: data.ageYears,
        scenarioId: data.scenarioId,
      });
    } catch (e) {
      console.error(e);
      showToast("error", e.message || "Could not apply decision");
    } finally {
      setIsConfirming(false);
      setSavingRound(false);
    }
  }, [
    selectedChoice,
    isConfirming,
    savingRound,
    currentEvent,
    currentRound,
    sessionId,
    metrics,
    recordRoundSnapshot,
    hydrateGameView,
    router,
    setDebriefData,
    showToast,
  ]);

  const handleExitGame = useCallback(async () => {
    if (!sessionId || exiting) return;

    setExiting(true);
    try {
      const res = await fetch(`${API}/game/session/${sessionId}/abandon`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Could not exit session");
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gameSessionId");
      }
      setShowExitModal(false);
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      showToast("error", e.message || "Could not exit game");
    } finally {
      setExiting(false);
    }
  }, [sessionId, exiting, router, showToast]);

  if (authLoading || loadingSession) {
    return <GameLoadingScreen />;
  }

  if (!user || !session || !currentEvent || !roundData) return null;

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {crisisFlash ? (
        <div className="crisis-flash-overlay" aria-hidden="true" />
      ) : null}
      <GameToast toast={toast} />

      <ConfirmModal
        open={showExitModal}
        title="Exit this simulation?"
        description="Your progress will be saved to your dashboard. You can review your decisions later or start a new simulation anytime."
        confirmLabel={exiting ? "Saving…" : "Save & Exit"}
        cancelLabel="Keep Playing"
        confirmVariant="danger"
        loading={exiting}
        onConfirm={handleExitGame}
        onCancel={() => setShowExitModal(false)}
      />

      <GameHeader
        userName={userName}
        exiting={exiting}
        onExitGame={() => setShowExitModal(true)}
        onOpenAdvisor={() => setAdvisorOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        <GameMetricsSidebar
          open={sidebarOpen}
          userName={userName}
          roundData={roundData}
          currentRound={currentRound}
          session={session}
          metrics={metrics}
          exiting={exiting}
          onExitGame={() => setShowExitModal(true)}
          onClose={() => setSidebarOpen(false)}
        />

        <GameRoundPanel
          roundData={roundData}
          currentRound={currentRound}
          currentEvent={currentEvent}
          isCrisis={isCrisis}
          selectedChoice={selectedChoice}
          isConfirming={isConfirming}
          savingRound={savingRound}
          onChoose={selectChoice}
          onConfirm={handleConfirm}
        />

        <aside className="hidden lg:flex w-80 flex-shrink-0 border-l border-[#1A1A1A] flex-col p-4 bg-[#0A0A0A] overflow-hidden">
          <AdvisorPanel
            sessionId={sessionId}
            round={currentRound}
            advisorMessages={advisorState.advisorMessages}
            advisorCallsUsed={advisorState.advisorCallsUsed}
            onAdvisorUpdate={handleAdvisorUpdate}
          />
        </aside>
      </div>

      <GameFooter
        currentRound={currentRound}
        remainingRounds={remainingRounds}
      />

      <BottomSheet
        open={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        title="FinSim Advisor"
        description="Ask for a Socratic question before you decide — up to 4 times per game."
      >
        <div className="h-[56vh] min-h-[340px]">
          <AdvisorPanel
            sessionId={sessionId}
            round={currentRound}
            advisorMessages={advisorState.advisorMessages}
            advisorCallsUsed={advisorState.advisorCallsUsed}
            onAdvisorUpdate={handleAdvisorUpdate}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
