"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Share2, X } from "lucide-react";
import ShareCard from "./ShareCard";
import { buildPreviewCard, createSessionShare } from "@/lib/share";

function CopyButton({ label, value, onCopied }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      onCopied?.();
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-40"
      style={{
        borderColor: done ? "rgba(16,185,129,0.4)" : "#2A2A2A",
        color: done ? "#10B981" : "#A1A1A1",
        background: "#111111",
        fontFamily: "var(--font-display)",
      }}
    >
      <Copy className="w-4 h-4" aria-hidden />
      {done ? "Copied!" : label}
    </button>
  );
}

export default function ShareSheet({
  open,
  onClose,
  sessionId,
  debrief,
  displayMetrics,
  playerName,
}) {
  const [url, setUrl] = useState(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const preview = buildPreviewCard({ debrief, displayMetrics, playerName });
  const displayCard = card || preview;

  const loadShare = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createSessionShare(sessionId);
      setUrl(data.url);
      setCard(data.card);
    } catch (err) {
      setError(err.message || "Could not create share link");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!open) return;
    loadShare();
  }, [open, loadShare]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleNativeShare = async () => {
    if (!navigator.share || !url) return;
    try {
      await navigator.share({
        title: `${displayCard?.playerName}'s FinSim Result`,
        text: displayCard?.shareText || "",
        url,
      });
    } catch {
      /* user cancelled */
    }
  };

  if (!open) return null;

  const tweetText = encodeURIComponent(
    displayCard?.shareText || `Check out my FinSim result!`,
  );
  const tweetUrl = url
    ? `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close share"
      />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] shadow-2xl animate-fade-in-up">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#1F1F1F] bg-[#0A0A0A]/95 backdrop-blur">
          <div>
            <h2
              id="share-sheet-title"
              className="text-lg font-bold text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Share your result
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Preview card + link friends can open
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#F5F5F5] hover:bg-[#1F1F1F] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <ShareCard card={displayCard} />

          {loading && !url ? (
            <p className="text-center text-xs text-[#6B6B6B]">
              Creating share link…
            </p>
          ) : null}
          {error ? (
            <p className="text-center text-xs text-red-400">{error}</p>
          ) : null}

          {url ? (
            <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] px-3 py-2.5 flex items-center gap-2">
              <Link2 className="w-4 h-4 shrink-0 text-[#F59E0B]" aria-hidden />
              <span className="text-xs text-[#A1A1A1] truncate flex-1">
                {url}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <CopyButton label="Copy link" value={url} />
            <CopyButton label="Copy caption" value={displayCard?.shareText} />
          </div>

          <div className="flex gap-2">
            {typeof navigator !== "undefined" && navigator.share && url ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: "#F59E0B",
                  color: "#0A0A0A",
                  fontFamily: "var(--font-display)",
                }}
              >
                <Share2 className="w-4 h-4" aria-hidden />
                Share…
              </button>
            ) : null}
            {tweetUrl ? (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold text-center transition-colors"
                style={{
                  borderColor: "#2A2A2A",
                  color: "#A1A1A1",
                  background: "#111111",
                  fontFamily: "var(--font-display)",
                }}
              >
                Post on X
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
