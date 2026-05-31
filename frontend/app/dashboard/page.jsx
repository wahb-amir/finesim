"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { formatCurrency, prettifyLabel } from "@/lib/format";
import { Trophy, BarChart2, ChevronDown, ChevronUp, Search, History } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  completed: { label: "Completed", color: "#10B981" },
  active: { label: "In Progress", color: "#F59E0B" },
  abandoned: { label: "Abandoned", color: "#6B6B6B" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SessionCard({ session, onSelect, isReplay = false, hasReplays = false, isExpanded = false, onToggleExpand = null }) {
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.abandoned;
  const netWorth = session.finalMetrics?.netWorth;
  const roundsPlayed =
    session.rounds?.length ?? Math.max(0, session.currentRound - 1);
  const scoreLabel =
    session.debriefData?.headline?.scoreLabel ??
    session.debriefData?.scoreLabel;

  return (
        <div
      role="button"
      onClick={() => onSelect(session)}
      className="group w-full rounded-2xl border border-[#242424] bg-[#101010] p-5 text-left transition-all duration-200 hover:border-[#F59E0B]/40 hover:bg-[#131313] hover:shadow-[0_0_30px_rgba(245,158,11,0.06)] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            {scoreLabel ? (
              <span className="text-[10px] text-[#6B6B6B]">{scoreLabel}</span>
            ) : null}
          </div>
          <h3
            className="mt-1 truncate text-lg font-bold text-[#F5F5F5] group-hover:text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isReplay ? `Replay (Round ${session.replayFromRound})` : (session.career || "Simulation Run")}
          </h3>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            {prettifyLabel(session.goal)} · {session.climateLabel || "Stable"} ·{" "}
            {roundsPlayed}/10 rounds
          </p>
        </div>

        {netWorth != null ? (
          <div className="text-right flex-shrink-0">
            <div
              className="text-lg font-bold"
              style={{ color: netWorth >= 0 ? "#10B981" : "#EF4444" }}
            >
              {netWorth >= 0 ? "+" : ""}
              {formatCurrency(netWorth)}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#6B6B6B]">
              Net Worth
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 text-[#6B6B6B]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="opacity-50 transition group-hover:opacity-100 group-hover:translate-x-0.5"
            >
              <path
                d="M7 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#6B6B6B]">
        <div className="flex flex-wrap gap-x-4">
          <span>{formatDate(session.createdAt)}</span>
          {session.startSalary ? (
            <span>
              Started at ${Number(session.startSalary).toLocaleString()}/yr
            </span>
          ) : null}
          {session.scenarioId ? (
            <span className="capitalize">
              {session.scenarioId.replace(/-/g, " ")}
            </span>
          ) : null}
        </div>
        {hasReplays && (
          <button 
            type="button" 
            onClick={(e) => { 
              e.stopPropagation(); 
              if(onToggleExpand) onToggleExpand(); 
            }} 
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#242424] hover:bg-[#2A2A2A] text-[#F5F5F5] transition"
          >
            <History size={12} /> {isExpanded ? "Hide Replays" : "View Replays"} {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [debriefPreview, setDebriefPreview] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState({});
  const itemsPerPage = 10;

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/game/sessions`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
      return;
    }
    if (user) loadSessions();
  }, [authLoading, user, router, loadSessions]);

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setDetailLoading(true);
    setDebriefPreview(null);
    setDebriefLoading(session.status === "completed");

    try {
      const res = await fetch(`${API}/game/session/${session._id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success && data.session) {
        setSelectedSession({
          ...session,
          ...data.session,
          rounds: data.session.rounds,
        });
      }

      if (session.status === "completed") {
        try {
          const debriefRes = await fetch(
            `${API}/game/session/${session._id}/debrief`,
            { credentials: "include" },
          );
          const debriefData = await debriefRes.json();
          if (debriefData?.success && debriefData.debrief) {
            setDebriefPreview(debriefData.debrief);
          }
        } catch (debriefErr) {
          console.error(debriefErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
      setDebriefLoading(false);
    }
  };

  const handleViewDebrief = (sessionId) => {
    router.push(`/debrief?sessionId=${sessionId}`);
  };

  const handleContinue = (sessionId) => {
    localStorage.setItem("gameSessionId", sessionId);
    router.push(`/game?sessionId=${sessionId}`);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const career = s.career?.toLowerCase() || "";
      const scenario = s.scenarioId?.toLowerCase() || "";
      if (!career.includes(q) && !scenario.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
    active: sessions.filter((s) => s.status === "active").length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <AppNavbar />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-[#F59E0B]">
          <div className="text-center">
            <div className="mb-3 text-2xl">Loading dashboard…</div>
            <div className="text-sm text-[#6B6B6B]">
              Fetching your simulation history
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionDetailModal
        session={selectedSession}
        loading={detailLoading}
        debriefPreview={debriefPreview}
        debriefLoading={debriefLoading}
        onClose={() => {
          setSelectedSession(null);
          setDebriefPreview(null);
        }}
        onViewDebrief={handleViewDebrief}
        onContinue={handleContinue}
      />

      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <AppNavbar />
        <div
          className="pointer-events-none fixed left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 opacity-[0.05]"
          style={{
            background: "radial-gradient(ellipse, #F59E0B, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
          <div className="mb-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#6B6B6B]">
                Your Dashboard
              </p>
              <h1
                className="mt-2 text-4xl font-bold text-[#F5F5F5]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Welcome back, {user?.name?.split(" ")[0] || "Player"}
              </h1>
              <p className="mt-2 text-sm text-[#A1A1A1]">
                Review past simulations, revisit debriefs, or start a new run.
              </p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-4">
            {[
              { label: "Total Runs", value: stats.total },
              { label: "Completed", value: stats.completed },
              { label: "In Progress", value: stats.active },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#242424] bg-[#101010] p-4 text-center"
              >
                <div
                  className="text-2xl font-bold text-[#F5F5F5]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-[#6B6B6B]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="group mb-4 w-full rounded-2xl border border-[#242424] bg-[#101010] p-5 text-left transition-all duration-200 hover:border-[#F59E0B]/40 hover:bg-[#131313] hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-lg font-bold text-black">
                  {user?.name
                    ?.split(" ")
                    .map((w) => w[0]?.toUpperCase())
                    .join("")
                    .slice(0, 2) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F59E0B]">
                    Your Profile
                  </p>
                  <h2
                    className="mt-1 text-lg font-bold text-[#F5F5F5] group-hover:text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Account & financial overview
                  </h2>
                  <p className="mt-1 text-sm text-[#6B6B6B]">
                    View your account details, financial metrics, and sign out
                    from your profile page.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-[#6B6B6B] transition group-hover:translate-x-0.5 group-hover:text-[#F59E0B]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7 4l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/leaderboard")}
            className="group mb-8 w-full rounded-2xl border border-[#242424] bg-[#101010] p-5 text-left transition-all duration-200 hover:border-[#F59E0B]/40 hover:bg-[#131313] hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 text-[#F59E0B]">
                  <Trophy size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F59E0B]">
                    Leaderboard
                  </p>
                  <h2
                    className="mt-1 text-lg font-bold text-[#F5F5F5] group-hover:text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    See how you rank
                  </h2>
                  <p className="mt-1 text-sm text-[#6B6B6B]">
                    Compare your best simulation score against other players on
                    the all-time leaderboard.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-[#6B6B6B] transition group-hover:translate-x-0.5 group-hover:text-[#F59E0B]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7 4l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </button>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2">
              {[
                { id: "all", label: "All" },
                { id: "completed", label: "Completed" },
                { id: "active", label: "In Progress" },
                { id: "abandoned", label: "Abandoned" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                    filter === tab.id
                      ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30"
                      : "text-[#6B6B6B] border border-transparent hover:text-[#A1A1A1]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#6B6B6B]">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101010] border border-[#242424] rounded-lg py-2 pl-10 pr-4 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]/50 transition"
              />
            </div>
          </div>

          {(() => {
            if (filteredSessions.length === 0) {
              return (
                <div className="rounded-3xl border border-dashed border-[#2A2A2A] bg-[#101010]/50 py-20 text-center">
                  <div className="mb-4 text-[#F59E0B] flex justify-center"><BarChart2 size={48} /></div>
                  <h2 className="text-xl font-bold text-[#F5F5F5]">
                    No simulations yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
                    Start your first financial life simulation to see your history,
                    decisions, and debriefs here.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/setup")}
                    className="mt-6 rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  >
                    Start Your First Run
                  </button>
                </div>
              );
            }

            const tree = [];
            const sessionMap = new Map();

            filteredSessions.forEach((s) => {
              sessionMap.set(s._id, { session: s, children: [] });
            });

            filteredSessions.forEach((s) => {
              if (s.isReplay && s.replayOf && sessionMap.has(s.replayOf)) {
                sessionMap.get(s.replayOf).children.push(sessionMap.get(s._id));
              } else {
                tree.push(sessionMap.get(s._id));
              }
            });

            const totalPages = Math.ceil(tree.length / itemsPerPage);
            const paginatedTree = tree.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <div className="space-y-4">
                {paginatedTree.map((node) => {
                  const hasReplays = node.children.length > 0;
                  const isExpanded = !!expandedNodes[node.session._id];
                  return (
                    <div key={node.session._id} className="space-y-2">
                      <SessionCard
                        session={node.session}
                        onSelect={handleSelectSession}
                        isReplay={node.session.isReplay}
                        hasReplays={hasReplays}
                        isExpanded={isExpanded}
                        onToggleExpand={() => setExpandedNodes(prev => ({ ...prev, [node.session._id]: !prev[node.session._id] }))}
                      />
                      {hasReplays && isExpanded && (
                        <div className="pl-6 space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-12 before:w-px before:bg-[#2A2A2A]">
                          {node.children.map((childNode, idx) => {
                            const isLast = idx === node.children.length - 1;
                            return (
                              <div key={childNode.session._id} className="relative">
                                <div className="absolute -left-6 top-[28px] h-px w-6 bg-[#2A2A2A]" />
                                <SessionCard
                                  session={childNode.session}
                                  onSelect={handleSelectSession}
                                  isReplay={true}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-[#101010] border border-[#242424] disabled:opacity-50 text-sm hover:border-[#F59E0B]/30 transition"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-[#6B6B6B]">Page {currentPage} of {totalPages}</span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-[#101010] border border-[#242424] disabled:opacity-50 text-sm hover:border-[#F59E0B]/30 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
