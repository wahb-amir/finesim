"use client";
import { useState, useEffect } from "react";
import { myths } from "../../lib/data";
import {
  CreditCard,
  GraduationCap,
  TrendingUp,
  Hourglass,
  Target,
  Brain,
  BarChart2,
  Lightbulb,
  Trophy,
  History,
  GitBranch
} from "lucide-react";

export function HeroSection({ onStart }) {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCounter((c) => {
        if (c >= 89) {
          clearInterval(t);
          return 89;
        }
        return c + 1;
      });
    }, 20);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 60px",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 450,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 14px",
          borderRadius: 9999,
          border: "1px solid rgba(245,158,11,0.2)",
          background: "rgba(245,158,11,0.05)",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#F59E0B",
            boxShadow: "0 0 0 3px rgba(245,158,11,0.2)",
          }}
        />
        <span
          style={{
            color: "#F59E0B",
            fontSize: 11,
            fontWeight: 510,
            letterSpacing: "0.08em",
          }}
        >
          HACKATHON · FINANCIAL LITERACY SIMULATOR
        </span>
      </div>
      <h1
        style={{
          fontSize: "clamp(40px, 6vw, 76px)",
          fontWeight: 510,
          lineHeight: 1.0,
          letterSpacing: "-1.6px",
          color: "#F7F8F8",
          margin: "0 0 24px",
          maxWidth: 900,
        }}
      >
        Live{" "}
        <span style={{ color: "#F59E0B", position: "relative" }}>10 years</span>{" "}
        of financial decisions in{" "}
        <span style={{ color: "#F7F8F8" }}>15 minutes.</span>
      </h1>
      <p
        style={{
          color: "#8A8F98",
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 560,
          margin: "0 0 40px",
          letterSpacing: "-0.165px",
        }}
      >
        {counter}% of teens graduate without understanding credit scores,
        compound interest, or how a single financial decision echoes across
        decades.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onStart}
          style={{
            background: "#F59E0B",
            border: "none",
            color: "#0A0A0A",
            fontSize: 15,
            fontWeight: 590,
            cursor: "pointer",
            padding: "13px 28px",
            borderRadius: 8,
            letterSpacing: "-0.165px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 0 40px rgba(245,158,11,0.25)",
          }}
        >
          Start Simulation
        </button>
      </div>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    {
      number: "43%",
      label: "Think 18% APR is manageable",
      sub: "It means paying $2,500 extra on a $5k balance over 3 years",
      color: "#EF4444",
      icon: <CreditCard size={28} />,
    },
    {
      number: "78%",
      label: "Teens lack basic credit knowledge",
      sub: "By graduation, many have already made irreversible financial mistakes",
      color: "#F59E0B",
      icon: <GraduationCap size={28} />,
    },
    {
      number: "$1.7T",
      label: "US student loan debt",
      sub: "Most borrowers didn't understand compound interest when they signed",
      color: "#10B981",
      icon: <TrendingUp size={28} />,
    },
    {
      number: "30yrs",
      label: "Avg. time to learn from mistakes",
      sub: "Financial education is still taught by life experience instead of in school",
      color: "#818CF8",
      icon: <Hourglass size={28} />,
    },
  ];

  return (
    <section style={{ padding: "80px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h2
          style={{
            color: "#F7F8F8",
            fontSize: 36,
            fontWeight: 510,
            letterSpacing: "-0.7px",
            lineHeight: 1.1,
            margin: "0 0 12px",
          }}
        >
          Financial illiteracy is a crisis
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "28px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: s.color,
                opacity: 0.7,
              }}
            />
            <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
            <div
              style={{
                color: s.color,
                fontSize: 36,
                fontWeight: 590,
                letterSpacing: "-0.7px",
                lineHeight: 1,
              }}
            >
              {s.number}
            </div>
            <div
              style={{
                color: "#F7F8F8",
                fontSize: 14,
                fontWeight: 510,
                margin: "8px 0 6px",
              }}
            >
              {s.label}
            </div>
            <div style={{ color: "#62666D", fontSize: 12, lineHeight: 1.6 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MythBusterSection() {
  const [revealed, setRevealed] = useState({});
  return (
    <section
      style={{
        padding: "80px 32px",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              color: "#F7F8F8",
              fontSize: 36,
              fontWeight: 510,
              letterSpacing: "-0.7px",
              margin: "0 0 12px",
            }}
          >
            What you believe might be costing you
          </h2>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {myths.map((m, i) => (
            <button
              key={i}
              onClick={() => setRevealed((r) => ({ ...r, [i]: !r[i] }))}
              style={{
                background: revealed[i]
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${revealed[i] ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10,
                padding: "20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    color: "#F7F8F8",
                    fontSize: 14,
                    fontWeight: 510,
                    lineHeight: 1.5,
                    flex: 1,
                    marginRight: 12,
                  }}
                >
                  "{m.myth}"
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    background: `${m.color}18`,
                    color: m.color,
                    fontSize: 10,
                    fontWeight: 590,
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: `1px solid ${m.color}30`,
                  }}
                >
                  {m.verdict}
                </div>
              </div>
              {revealed[i] ? (
                <div
                  style={{
                    color: "#8A8F98",
                    fontSize: 13,
                    lineHeight: 1.6,
                    marginTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: 10,
                  }}
                >
                  {m.reality}
                </div>
              ) : (
                <div style={{ color: "#62666D", fontSize: 12, marginTop: 4 }}>
                  Tap to reveal the reality →
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      title: "Choose your starting point",
      desc: "Pick your age, income level, and life scenario. No sugar-coating.",
      icon: <Target size={28} />,
    },
    {
      n: "02",
      title: "Make real decisions",
      desc: "Credit cards, jobs, investments, emergencies — real forks in the road.",
      icon: <Brain size={28} />,
    },
    {
      n: "03",
      title: "See the ripple effect",
      desc: "Each choice updates your net worth, credit score, and life trajectory in real time.",
      icon: <BarChart2 size={28} />,
    },
    {
      n: "04",
      title: "Learn from the outcome",
      desc: "Every decision, good or bad, teaches the underlying financial principle.",
      icon: <Lightbulb size={28} />,
    },
    {
      n: "05",
      title: "Climb the leaderboard",
      desc: "Your best completed run is ranked against other players by net worth and credit score.",
      icon: <Trophy size={28} />,
    },
  ];
  return (
    <section style={{ padding: "80px 32px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h2
          style={{
            color: "#F7F8F8",
            fontSize: 36,
            fontWeight: 510,
            letterSpacing: "-0.7px",
            margin: "0 0 12px",
          }}
        >
          Learn by doing. Not by reading.
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 2,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s.n}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "28px 24px",
              position: "relative",
            }}
          >
            <div style={{ color: "rgba(245,158,11,0.8)", marginBottom: 16 }}>{s.icon}</div>
            <div
              style={{
                color: "rgba(245,158,11,0.4)",
                fontSize: 13,
                fontWeight: 590,
                marginBottom: 8,
                fontFamily: "monospace",
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                color: "#F7F8F8",
                fontSize: 16,
                fontWeight: 510,
                marginBottom: 8,
              }}
            >
              {s.title}
            </div>
            <div style={{ color: "#8A8F98", fontSize: 13, lineHeight: 1.6 }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LeaderboardSection({ onViewLeaderboard }) {
  return (
    <section
      style={{
        padding: "80px 32px",
        background: "rgba(245,158,11,0.03)",
        borderTop: "1px solid rgba(245,158,11,0.08)",
        borderBottom: "1px solid rgba(245,158,11,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 9999,
            border: "1px solid rgba(245,158,11,0.2)",
            background: "rgba(245,158,11,0.05)",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#F59E0B" }}><Trophy size={16} /></span>
          <span
            style={{
              color: "#F59E0B",
              fontSize: 11,
              fontWeight: 510,
              letterSpacing: "0.08em",
            }}
          >
            COMPETE & COMPARE
          </span>
        </div>
        <h2
          style={{
            color: "#F7F8F8",
            fontSize: 36,
            fontWeight: 510,
            letterSpacing: "-0.7px",
            margin: "0 0 12px",
          }}
        >
          Climb the all-time leaderboard
        </h2>
        <p
          style={{
            color: "#8A8F98",
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: "0 auto 32px",
          }}
        >
          Complete a 10-round simulation and see how your best run stacks up
          against other players. Ranked by composite score from net worth and
          credit score.
        </p>
        <button
          onClick={onViewLeaderboard}
          style={{
            background: "transparent",
            border: "1px solid rgba(245,158,11,0.35)",
            color: "#F59E0B",
            fontSize: 15,
            fontWeight: 590,
            cursor: "pointer",
            padding: "12px 28px",
            borderRadius: 8,
            letterSpacing: "-0.165px",
          }}
        >
          View Leaderboard
        </button>
      </div>
    </section>
  );
}

export function FinalCTA({ onStart }) {
  return (
    <section
      style={{
        padding: "100px 32px",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.1) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <h2
        style={{
          color: "#F7F8F8",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 510,
          letterSpacing: "-1.2px",
          lineHeight: 1.05,
          margin: "0 auto 20px",
          maxWidth: 640,
        }}
      >
        Your financial future starts with a single decision.
      </h2>
      <button
        onClick={onStart}
        style={{
          background: "#F59E0B",
          border: "none",
          color: "#0A0A0A",
          fontSize: 16,
          fontWeight: 590,
          cursor: "pointer",
          padding: "16px 36px",
          borderRadius: 10,
          letterSpacing: "-0.165px",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 0 60px rgba(245,158,11,0.3)",
        }}
      >
        Start Simulation — It's Free
      </button>
    </section>
  );
}

export function ReplaySection() {
  return (
    <section
      style={{
        padding: "80px 32px",
        background: "#08090A",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 60, alignItems: "center" }}>
        <div style={{ flex: "1 1 400px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 9999,
              border: "1px solid rgba(16,185,129,0.2)",
              background: "rgba(16,185,129,0.05)",
              marginBottom: 24,
            }}
          >
            <span style={{ color: "#10B981" }}><GitBranch size={16} /></span>
            <span
              style={{
                color: "#10B981",
                fontSize: 11,
                fontWeight: 510,
                letterSpacing: "0.08em",
              }}
            >
              NEW FEATURE
            </span>
          </div>
          <h2
            style={{
              color: "#F7F8F8",
              fontSize: 36,
              fontWeight: 510,
              letterSpacing: "-0.7px",
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            "What if?" Branching Replays
          </h2>
          <p
            style={{
              color: "#8A8F98",
              fontSize: 16,
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Ever wonder how your life would turn out if you made a different choice? 
            Our branching replay system lets you jump back to any pivotal moment in your past runs, 
            diverge your path, and see the alternate timeline play out. 
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: <History size={20} />, title: "Jump back in time", desc: "Select any round from a completed simulation to replay." },
              { icon: <GitBranch size={20} />, title: "Create alternate timelines", desc: "Your original run is preserved. Explore infinite 'what ifs'." },
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ color: "#10B981", marginTop: 2 }}>{item.icon}</div>
                <div>
                  <h4 style={{ color: "#F7F8F8", fontSize: 15, margin: "0 0 4px", fontWeight: 510 }}>{item.title}</h4>
                  <p style={{ color: "#8A8F98", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: "1 1 400px", position: "relative" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 24,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 24, left: 35, bottom: 24, width: 2, background: "rgba(255,255,255,0.06)", zIndex: 0 }} />
            
            <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative", zIndex: 1, marginBottom: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10B981", border: "4px solid #08090A", flexShrink: 0 }} />
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "12px 16px", borderRadius: 8, flex: 1, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ color: "#F7F8F8", fontSize: 13, fontWeight: 510 }}>Original Timeline</div>
                <div style={{ color: "#8A8F98", fontSize: 12, marginTop: 4 }}>Net Worth: $124,000</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative", zIndex: 1, marginBottom: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F59E0B", border: "4px solid #08090A", flexShrink: 0, marginLeft: 24 }} />
              <div style={{ position: "absolute", top: "50%", left: 11, width: 24, height: 2, background: "rgba(255,255,255,0.06)", transform: "translateY(-50%)", zIndex: -1 }} />
              <div style={{ background: "rgba(245,158,11,0.05)", padding: "12px 16px", borderRadius: 8, flex: 1, border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ color: "#F59E0B", fontSize: 13, fontWeight: 510 }}>Alternate Choice: Invest Early</div>
                <div style={{ color: "#8A8F98", fontSize: 12, marginTop: 4 }}>Round 4 Divergence</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

