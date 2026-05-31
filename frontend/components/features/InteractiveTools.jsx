"use client";
import { useState } from "react";
import { calcCompound, compoundYears, scenarios } from "../../lib/data";
import { Lightbulb, Trophy, ThumbsUp, BookOpen } from "lucide-react";

export function CompoundCalculator() {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);

  const result = calcCompound(principal, rate, years);
  const gain = result - principal;
  const multiple = (result / principal).toFixed(1);
  const barData = compoundYears.map((y) => ({
    y,
    val: calcCompound(principal, rate, y),
    pct:
      (calcCompound(principal, rate, y) / calcCompound(principal, rate, 30)) *
      100,
  }));

  return (
    <section
      style={{
        padding: "80px 32px",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
            See compound interest work
          </h2>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* Controls */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "28px 24px",
            }}
          >
            {[
              {
                label: "Initial Investment",
                value: principal,
                min: 100,
                max: 50000,
                step: 100,
                set: setPrincipal,
                fmt: (v) => `$${v.toLocaleString()}`,
              },
              {
                label: "Annual Return",
                value: rate,
                min: 1,
                max: 20,
                step: 0.5,
                set: setRate,
                fmt: (v) => `${v}%`,
              },
              {
                label: "Time Horizon",
                value: years,
                min: 1,
                max: 40,
                step: 1,
                set: setYears,
                fmt: (v) => `${v} yrs`,
              },
            ].map(({ label, value, min, max, step, set, fmt }) => (
              <div key={label} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ color: "#8A8F98", fontSize: 13, fontWeight: 510 }}
                  >
                    {label}
                  </span>
                  <span
                    style={{ color: "#F59E0B", fontSize: 14, fontWeight: 590 }}
                  >
                    {fmt(value)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "#F59E0B",
                    cursor: "pointer",
                  }}
                />
              </div>
            ))}
            <div
              style={{
                marginTop: 8,
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 10,
                padding: "20px 20px",
              }}
            >
              <div
                style={{
                  color: "#8A8F98",
                  fontSize: 12,
                  fontWeight: 510,
                  marginBottom: 6,
                }}
              >
                FINAL VALUE
              </div>
              <div
                style={{
                  color: "#F59E0B",
                  fontSize: 40,
                  fontWeight: 590,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                ${result.toLocaleString()}
              </div>
              <div style={{ color: "#62666D", fontSize: 13, marginTop: 8 }}>
                +${gain.toLocaleString()} gain · {multiple}× your money
              </div>
            </div>
          </div>
          {/* Chart */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "28px 20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                color: "#8A8F98",
                fontSize: 12,
                fontWeight: 510,
                marginBottom: 20,
              }}
            >
              GROWTH OVER TIME
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                paddingBottom: 24,
                position: "relative",
              }}
            >
              {barData.map(({ y, val, pct }) => (
                <div
                  key={y}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: y === years ? "#F59E0B" : "#62666D",
                      fontWeight: y === years ? 590 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ${(val / 1000).toFixed(0)}k
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(pct, 3)}%`,
                      minHeight: 8,
                      background:
                        y <= years
                          ? `rgba(245,158,11,${0.3 + (pct / 100) * 0.7})`
                          : "rgba(255,255,255,0.05)",
                      borderRadius: "4px 4px 0 0",
                      border:
                        y === years ? "1px solid rgba(245,158,11,0.5)" : "none",
                      transition: "height 0.3s ease, background 0.3s ease",
                      maxHeight: "100%",
                    }}
                  />
                  <div style={{ fontSize: 10, color: "#62666D" }}>Y{y}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DecisionSimulator() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showLesson, setShowLesson] = useState(false);
  const [wealth, setWealth] = useState(0);
  const [history, setHistory] = useState([]);

  const scenario = scenarios[step];

  const handleChoice = (choice) => {
    setSelected(choice);
    setShowLesson(true);
  };

  const handleNext = () => {
    if (selected) {
      setWealth((w) => w + selected.impact);
      setHistory((h) => [
        ...h,
        {
          scenario: scenario.title,
          choice: selected.label,
          impact: selected.impact,
        },
      ]);
    }
    setSelected(null);
    setShowLesson(false);
    if (step < scenarios.length - 1) setStep((s) => s + 1);
  };

  const handleReset = () => {
    setStep(0);
    setSelected(null);
    setShowLesson(false);
    setWealth(0);
    setHistory([]);
  };

  const isDone = step === scenarios.length - 1 && showLesson;

  return (
    <section style={{ padding: "80px 32px", maxWidth: 900, margin: "0 auto" }}>
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
          Every choice has a consequence
        </h2>
      </div>

      {/* Wealth counter */}
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 9999,
          }}
        >
          <span style={{ fontSize: 12, color: "#62666D", fontWeight: 510 }}>
            NET WEALTH IMPACT
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 590,
              color: wealth >= 0 ? "#10B981" : "#EF4444",
            }}
          >
            {wealth >= 0 ? "+" : ""}${Math.abs(wealth).toLocaleString()}
          </span>
        </div>
      </div>

      {!isDone ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "32px 32px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                color: "#8A8F98",
                fontSize: 12,
                fontWeight: 510,
                marginBottom: 8,
              }}
            >
              AGE {scenario.age} · SCENARIO {step + 1} OF {scenarios.length}
            </div>
            <h3
              style={{
                color: "#F7F8F8",
                fontSize: 22,
                fontWeight: 510,
                margin: "0 0 8px",
              }}
            >
              {scenario.title}
            </h3>
            <p style={{ color: "#8A8F98", fontSize: 14, margin: 0 }}>
              {scenario.context}
            </p>
          </div>
          <div
            style={{
              padding: "24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {scenario.choices.map((c) => (
              <button
                key={c.label}
                onClick={() => !showLesson && handleChoice(c)}
                style={{
                  background:
                    selected === c
                      ? c.mood === "success"
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(239,68,68,0.08)"
                      : "rgba(255,255,255,0.02)",
                  border:
                    selected === c
                      ? `1px solid ${c.mood === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`
                      : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  cursor: showLesson ? "default" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ color: "#F7F8F8", fontSize: 15, fontWeight: 510 }}
                  >
                    {c.label}
                  </div>
                  <div style={{ color: "#62666D", fontSize: 12, marginTop: 2 }}>
                    {c.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {showLesson && selected && (
            <div
              style={{
                margin: "0 32px 24px",
                padding: "20px",
                background: "rgba(245,158,11,0.04)",
                border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  color: "#F59E0B",
                  fontSize: 11,
                  fontWeight: 590,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Lightbulb size={14} /> LESSON
              </div>
              <p
                style={{
                  color: "#D0D6E0",
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {selected.lesson}
              </p>
            </div>
          )}
          {showLesson && (
            <div
              style={{
                padding: "0 32px 28px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleNext}
                style={{
                  background: "#F59E0B",
                  border: "none",
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: 590,
                  cursor: "pointer",
                  padding: "10px 24px",
                  borderRadius: 8,
                }}
              >
                {step < scenarios.length - 1
                  ? "Next Scenario →"
                  : "See Results →"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            {wealth >= 40000 ? <Trophy size={48} color="#F59E0B" /> : wealth >= 0 ? <ThumbsUp size={48} color="#10B981" /> : <BookOpen size={48} color="#818CF8" />}
          </div>
          <h3
            style={{
              color: "#F7F8F8",
              fontSize: 28,
              fontWeight: 510,
              letterSpacing: "-0.5px",
              margin: "0 0 8px",
            }}
          >
            {wealth >= 40000
              ? "Excellent decisions!"
              : wealth >= 0
                ? "Good instincts!"
                : "Costly choices — but now you know"}
          </h3>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 32,
            }}
          >
            <button
              onClick={handleReset}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#D0D6E0",
                fontSize: 14,
                fontWeight: 510,
                cursor: "pointer",
                padding: "11px 24px",
                borderRadius: 8,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
