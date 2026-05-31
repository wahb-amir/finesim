import { useState, useEffect } from "react";
import { API } from "@/components/game/constants";

export function useGameSession({
  routeSessionId,
  querySessionId,
  authLoading,
  user,
  router,
  hydrateGameView,
  setPlayerName,
  setGoal,
  showToast,
}) {
  const [sessionId, setSessionId] = useState(
    routeSessionId || querySessionId || "",
  );
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem("gameSessionId")
          : "";
      if (stored) setSessionId(stored);
    }
  }, [sessionId]);

  useEffect(() => {
    const activeSessionId = routeSessionId || querySessionId || sessionId;
    if (!activeSessionId) {
      if (authLoading) return;
      router.replace("/setup");
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        setLoadingSession(true);

        const res = await fetch(`${API}/game/session/${activeSessionId}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok || !data?.success || !data?.session) {
          if (!cancelled) router.replace("/setup");
          return;
        }

        const loadedSession = data.session;
        if (cancelled) return;

        setSession(loadedSession);
        setSessionId(activeSessionId);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("gameSessionId", activeSessionId);
        }

        if (loadedSession.status === "completed") {
          router.replace(`/debrief?sessionId=${activeSessionId}`);
          return;
        }

        if (loadedSession.status === "abandoned") {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("gameSessionId");
          }
          router.replace("/setup");
          return;
        }

        setPlayerName(loadedSession.playerName || user?.name || "Player");
        setGoal(loadedSession.goal || "");

        if (!data.event || !data.metrics) {
          showToast("error", "Session is missing simulation state");
          router.replace("/setup");
          return;
        }

        hydrateGameView({
          currentRound: data.currentRound ?? loadedSession.currentRound,
          metrics: data.metrics,
          event: data.event,
          narrative: data.narrative,
          scenarioId: data.scenarioId ?? loadedSession.scenarioId,
          ageYears: data.ageYears,
        });
      } catch (err) {
        console.error("[loadSession]", err);
        if (!cancelled) router.replace("/setup");
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    hydrateGameView,
    querySessionId,
    routeSessionId,
    router,
    sessionId,
    setGoal,
    setPlayerName,
    showToast,
    user?.name,
  ]);

  return { sessionId, session, loadingSession };
}
