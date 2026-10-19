"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface LogEntry {
  time: string;
  text: string;
  urgency: "green" | "amber" | "red" | "neutral";
}

const PRESET_ENTRIES: LogEntry[] = [
  { time: "", text: "Room 306 — repositioned to right side, incontinence care complete", urgency: "green" },
  { time: "", text: "Room 312 — resident appears more confused than baseline, noted for monitoring", urgency: "amber" },
  { time: "", text: "Room 308 — vitals: BP 142/88, elevated, flagged for follow-up", urgency: "amber" },
  { time: "", text: "Room 301: Mr. Davis — BP 156/94, second elevated reading this shift", urgency: "red" },
  { time: "", text: "Room 309 — refused evening meds, family notified per protocol", urgency: "amber" },
];

const URGENCY_COLORS = {
  green: { icon: "✓", label: "Completed", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  amber: { icon: "⚠", label: "Watch", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  red: { icon: "🔴", label: "Urgent", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  neutral: { icon: "•", label: "Note", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
};

function useShiftTimer() {
  const [seconds, setSeconds] = useState(7 * 3600 + 42 * 60);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getNow() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

interface AiHandoffItem {
  room?: string;
  note: string;
  why?: string;
}
interface AiHandoff {
  urgent: AiHandoffItem[];
  watch: AiHandoffItem[];
  routine: AiHandoffItem[];
  ratio: { over_limit: boolean; assigned: number; legal: number; over_by: number; summary: string };
}

export default function DemoPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [handoffExpanded, setHandoffExpanded] = useState(false);
  const [aiHandoff, setAiHandoff] = useState<AiHandoff | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [noteText, setNoteText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Bumped on every log change; a handoff response for an older version is dropped.
  const logVersionRef = useRef(0);
  const shiftTimer = useShiftTimer();

  const residentCount = 14;
  const ratio = `1:${residentCount}`;
  const legalLimit = "1:8";
  const ratioOverLimit = residentCount > 8;

  // Add a raw note to the log and invalidate any stale AI handoff.
  function pushLog(text: string, urgency: LogEntry["urgency"] = "neutral") {
    const t = text.trim();
    if (!t) return;
    setLogs((prev) => [{ time: getNow(), text: t, urgency }, ...prev]);
    logVersionRef.current += 1;
    setAiHandoff(null);
    setHandoffExpanded(false);
  }

  // Wire the browser's built-in speech recognition (Chrome/Edge/Safari).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    setMicSupported(true);
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      pushLog(transcript);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateHandoff() {
    if (logs.length === 0) return;
    if (aiHandoff) {
      setHandoffExpanded((v) => !v);
      return;
    }
    setGenerating(true);
    setGenError(false);
    const version = logVersionRef.current;
    try {
      // Send the raw spoken notes (oldest first) to the real AI backend.
      const notes = [...logs].reverse().map((l) => l.text);
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, assigned: residentCount, legal: 8 }),
      });
      const data = await res.json();
      // A note was added while this was in flight: this handoff is already stale.
      if (version !== logVersionRef.current) return;
      if (res.ok && data.handoff) {
        setAiHandoff(data.handoff);
        setHandoffExpanded(true);
      } else {
        setGenError(true);
      }
    } catch {
      if (version === logVersionRef.current) setGenError(true);
    } finally {
      setGenerating(false);
    }
  }

  function handleMicTap() {
    if (listening) return;
    // Real speech recognition where the browser supports it.
    if (micSupported && recognitionRef.current) {
      setListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setListening(false);
      }
      return;
    }
    // Fallback for browsers without the Web Speech API: play back sample notes.
    if (nextIndex >= PRESET_ENTRIES.length) return;
    setListening(true);
    setTimeout(() => {
      const entry = PRESET_ENTRIES[nextIndex];
      pushLog(entry.text, entry.urgency);
      setNextIndex((i) => i + 1);
      setListening(false);
    }, 2000);
  }

  const urgentEntries = logs.filter((l) => l.urgency === "red");
  const watchEntries = logs.filter((l) => l.urgency === "amber");
  const fallbackDone = !micSupported && nextIndex >= PRESET_ENTRIES.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Top bar */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ backgroundColor: "#1B2B4B", color: "white" }}
      >
        <Link href="/" className="text-sm font-bold text-white">
          CNA Shield
        </Link>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span style={{ color: "#94A3B8" }}>
            Shift: <span className="text-white font-mono">{shiftTimer}</span>
          </span>
          <span style={{ color: "#94A3B8" }}>
            Residents: <span className="text-white font-bold">{residentCount}</span>
          </span>
          <span
            className="font-bold px-2 py-0.5 rounded text-sm"
            style={{
              backgroundColor: ratioOverLimit ? "#DC2626" : "#16A34A",
              color: "white",
            }}
          >
            Ratio {ratio} {ratioOverLimit ? "⚠" : "✓"}
          </span>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0">
        <h1 className="sr-only">CNA Shield shift log</h1>
        {/* LEFT: Voice log */}
        <div
          className="flex flex-col p-5"
          style={{ borderRight: "1px solid #E2E8F0" }}
        >
          {/* Mic button */}
          <div className="flex flex-col items-center py-6">
            <div className="relative">
              {listening && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: "#DC2626",
                    opacity: 0.3,
                    animation: "pulse-ring 1s ease-out infinite",
                  }}
                />
              )}
              <button
                onClick={handleMicTap}
                disabled={listening || fallbackDone}
                aria-label={
                  listening
                    ? "Listening"
                    : fallbackDone
                    ? "Sample log complete"
                    : micSupported
                    ? "Start a voice note"
                    : "Log a sample care note"
                }
                className="relative w-20 h-20 rounded-full text-3xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                style={{
                  backgroundColor: listening ? "#DC2626" : fallbackDone ? "#94A3B8" : "#1B2B4B",
                  cursor: listening || fallbackDone ? "not-allowed" : "pointer",
                }}
              >
                <span aria-hidden="true">{listening ? "⏺" : "🎙"}</span>
              </button>
            </div>
            <p role="status" aria-live="polite" className="mt-3 text-sm text-center" style={{ color: "#64748B" }}>
              {listening
                ? micSupported
                  ? "Listening… speak your note"
                  : "Listening…"
                : fallbackDone
                ? "Sample log complete"
                : micSupported
                ? "Tap and speak a care note"
                : "Tap to log care"}
            </p>
            <p className="mt-1 text-xs text-center" style={{ color: "#94A3B8" }}>
              {micSupported
                ? "Live voice input (your browser's speech recognition)"
                : "Voice input needs Chrome, Edge, or Safari — type a note below instead"}
            </p>

            {/* Typed-note fallback — works in every browser */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                pushLog(noteText);
                setNoteText("");
              }}
              className="mt-3 flex gap-2"
            >
              {/* text-base, not text-sm: iOS Safari zooms in on a focused input under 16px and stays zoomed (mobile-ui-audit, 2026-10-04) */}
              <label htmlFor="care-note" className="sr-only">
                Care note
              </label>
              <input
                id="care-note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="…or type a care note (e.g. Room 214 BP 150/95)"
                className="flex-1 rounded-lg px-3 py-2 text-base focus:outline-none"
                style={{ border: "1px solid #E2E8F0", color: "#1E293B" }}
              />
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "#1B2B4B" }}
              >
                Add
              </button>
            </form>
          </div>

          {/* Log entries */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {logs.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: "#94A3B8" }}>
                Tap the mic to start logging care
              </p>
            )}
            {logs.map((entry, i) => {
              const colors = URGENCY_COLORS[entry.urgency];
              return (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    animation: "slideIn 0.3s ease-out",
                  }}
                >
                  <span aria-hidden="true" style={{ color: colors.color, fontSize: 16, lineHeight: 1.5 }}>
                    {colors.icon}
                  </span>
                  <div>
                    <span className="sr-only">{colors.label}: </span>
                    <span className="text-xs font-mono mr-2" style={{ color: "#64748B" }}>
                      {entry.time}
                    </span>
                    <span className="text-sm" style={{ color: "#1E293B" }}>
                      {entry.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Handoff panel */}
        <div className="flex flex-col p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold" style={{ color: "#1E293B" }}>
                Shift Handoff Preview
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Updates as you log care
              </p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={generateHandoff}
                disabled={generating}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#1B2B4B" }}
              >
                {generating
                  ? "Generating…"
                  : aiHandoff
                  ? handoffExpanded
                    ? "Collapse"
                    : "Full Handoff"
                  : "Generate Full Handoff"}
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div
              className="flex-1 flex items-center justify-center rounded-2xl"
              style={{ border: "2px dashed #E2E8F0" }}
            >
              <p className="text-sm text-center" style={{ color: "#94A3B8" }}>
                Your handoff summary will<br />appear here as you log care
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentEntries.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#DC2626" }}>
                    <span aria-hidden="true">🔴</span> Urgent
                  </p>
                  {urgentEntries.map((e, i) => (
                    <p key={i} className="text-sm" style={{ color: "#1E293B" }}>
                      {e.text}
                    </p>
                  ))}
                </div>
              )}

              {watchEntries.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#D97706" }}>
                    <span aria-hidden="true">⚠</span> Watch
                  </p>
                  {watchEntries.map((e, i) => (
                    <p key={i} className="text-sm" style={{ color: "#1E293B" }}>
                      {e.text}
                    </p>
                  ))}
                </div>
              )}

              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#16A34A" }}>
                  <span aria-hidden="true">✓</span> Completed
                </p>
                <p className="text-sm" style={{ color: "#1E293B" }}>
                  {logs.length} care events logged this shift
                </p>
              </div>

              {/* Ratio callout */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: ratioOverLimit ? "#FEF2F2" : "#F0FDF4",
                  border: `1px solid ${ratioOverLimit ? "#FECACA" : "#BBF7D0"}`,
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
                  Staffing Ratio
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p
                      className="text-3xl font-bold"
                      style={{ color: ratioOverLimit ? "#DC2626" : "#16A34A" }}
                    >
                      {ratio}
                    </p>
                    <p className="text-xs" style={{ color: "#64748B" }}>This shift</p>
                  </div>
                  <div
                    className="text-2xl font-light"
                    style={{ color: "#CBD5E1" }}
                  >
                    vs
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: "#16A34A" }}>
                      {legalLimit}
                    </p>
                    <p className="text-xs" style={{ color: "#64748B" }}>Legal limit</p>
                  </div>
                </div>
                {ratioOverLimit && (
                  <p className="text-xs mt-2" style={{ color: "#DC2626" }}>
                    {residentCount - 8} residents over legal limit — logged for state registry
                  </p>
                )}
              </div>

              <p role="status" aria-live="polite" className="sr-only">
                {generating ? "Building the handoff" : genError ? "The handoff could not be built" : aiHandoff ? "Handoff ready" : ""}
              </p>

              {genError && (
                <p className="text-xs" style={{ color: "#DC2626" }}>
                  Couldn&apos;t build the handoff just now. Your notes are still here — try again in a moment.
                </p>
              )}

              {handoffExpanded && aiHandoff && (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    backgroundColor: "#EEF2F8",
                    border: "1px solid #E2E8F0",
                    animation: "fadeIn 0.3s ease-out",
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: "#1B2B4B" }}>
                    AI-Generated Shift Handoff
                  </p>
                  <p className="text-xs mb-3" style={{ color: "#64748B" }}>
                    Shift end: {getNow()} · Duration: {shiftTimer} · triaged by CNA Shield AI
                  </p>

                  {aiHandoff.urgent?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#DC2626" }}>
                        🔴 Urgent
                      </p>
                      {aiHandoff.urgent.map((e, i) => (
                        <p key={i} className="py-0.5" style={{ color: "#1E293B" }}>
                          {e.room ? <span className="font-semibold">{e.room}: </span> : null}
                          {e.note}
                          {e.why ? <span style={{ color: "#DC2626" }}> — {e.why}</span> : null}
                        </p>
                      ))}
                    </div>
                  )}

                  {aiHandoff.watch?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#D97706" }}>
                        ⚠ Watch
                      </p>
                      {aiHandoff.watch.map((e, i) => (
                        <p key={i} className="py-0.5" style={{ color: "#1E293B" }}>
                          {e.room ? <span className="font-semibold">{e.room}: </span> : null}
                          {e.note}
                        </p>
                      ))}
                    </div>
                  )}

                  {aiHandoff.routine?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#16A34A" }}>
                        ✓ Routine
                      </p>
                      {aiHandoff.routine.map((e, i) => (
                        <p key={i} className="py-0.5" style={{ color: "#1E293B" }}>
                          {e.room ? <span className="font-semibold">{e.room}: </span> : null}
                          {e.note}
                        </p>
                      ))}
                    </div>
                  )}

                  {aiHandoff.ratio?.summary && (
                    <p className="text-xs mt-2 pt-2" style={{ color: "#64748B", borderTop: "1px solid #E2E8F0" }}>
                      {aiHandoff.ratio.summary}
                    </p>
                  )}

                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid #E2E8F0" }}>
                    <button
                      className="w-full py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: "#1B2B4B" }}
                      onClick={() => alert("In production: submits to state registry + EHR")}
                    >
                      Submit to State Registry
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
