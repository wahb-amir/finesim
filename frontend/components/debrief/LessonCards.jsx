"use client";

export default function LessonCards({
  mistakes = [],
  compact = false,
  onReplayMoment,
  onHighlightRound,
}) {
  if (!mistakes.length) return null;

  return (
    <div
      className={`rounded-2xl border border-[#1F1F1F] bg-[#111111] ${compact ? "p-4 mb-4" : "p-6 mb-8"}`}
    >
      <h2
        className="font-bold text-[#F5F5F5] mb-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Lessons From Your Run
      </h2>
      <p className="text-[11px] text-[#6B6B6B] mb-5">
        Named patterns detected from your round-by-round decisions
      </p>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        {mistakes.map((m) => (
          <article
            key={`${m.id}-${m.round}`}
            className="rounded-xl border border-[#EF4444]/15 bg-[#0D0D0D] p-4 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#EF4444]/80">
                {m.id.replace(/_/g, " ")}
              </span>
              {m.round ? (
                <button
                  type="button"
                  onClick={() => onHighlightRound?.(m.round)}
                  className="text-[10px] text-[#6B6B6B] hover:text-[#F59E0B] transition-colors"
                >
                  Round {m.round}
                </button>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2 leading-snug">
              {m.label}
            </h3>
            {m.eventTitle ? (
              <p className="text-[11px] text-[#6B6B6B] mb-2">
                {m.eventTitle}
                {m.choiceMade ? ` · You chose ${m.choiceMade}` : ""}
              </p>
            ) : null}
            <p className="text-[12px] text-[#A1A1A1] leading-relaxed flex-1">
              {m.lesson}
            </p>
            {onReplayMoment ? (
              <button
                type="button"
                onClick={() => onReplayMoment(m)}
                className="mt-4 w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-left text-[12px] font-medium text-[#F59E0B] transition hover:border-[#F59E0B]/40 hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              >
                What if I&apos;d chosen differently here?
                <span className="block text-[10px] font-normal text-[#6B6B6B] mt-0.5">
                  Start a fresh run focused on this moment
                </span>
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
