"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LogEntry {
  time: string;
  text: string;
  urgency: "green" | "amber" | "red";
}

const PRESET_ENTRIES: LogEntry[] = [
  { time: "", text: "Room 306 — repositioned to right side, incontinence care complete", urgency: "green" },
  { time: "", text: "Room 312 — resident appears more confused than baseline, noted for monitoring", urgency: "amber" },
  { time: "", text: "Room 308 — vitals: BP 142/88, elevated, flagged for follow-up", urgency: "amber" },
  { time: "", text: "Room 301: Mr. Davis — BP 156/94, second elevated reading this shift", urgency: "red" },
  { time: "", text: "Room 309 — refused evening meds, family notified per protocol", urgency: "amber" },
];

const URGENCY_COLORS = {
  green: { icon: "✓", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  amber: { icon: "⚠", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  red: { icon: "🔴", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
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

export default function DemoPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [handoffExpanded, setHandoffExpanded] = useState(false);
  const shiftTimer = useShiftTimer();

  const residentCount = 14;
  const ratio = `1:${residentCount}`;
  const legalLimit = "1:8";
  const ratioOverLimit = residentCount > 8;

  function handleMicTap() {
    if (listening || nextIndex >= PRESET_ENTRIES.length) return;
    setListening(true);
    setTimeout(() => {
      const entry = { ...PRESET_ENTRIES[nextIndex], time: getNow() };
      setLogs((prev) => [entry, ...prev]);
      setNextIndex((i) => i + 1);
      setListening(false);
    }, 2500);
  }

  const urgentEntries = logs.filter((l) => l.urgency === "red");
  const watchEntries = logs.filter((l) => l.urgency === "amber");
  const allDone = nextIndex >= PRESET_ENTRIES.length;

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
                disabled={listening || allDone}
                className="relative w-20 h-20 rounded-full text-3xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                style={{
                  backgroundColor: listening ? "#DC2626" : allDone ? "#94A3B8" : "#1B2B4B",
                  cursor: listening || allDone ? "not-allowed" : "pointer",
                }}
              >
                {listening ? "⏺" : "🎙"}
              </button>
            </div>
            <p className="mt-3 text-sm text-center" style={{ color: "#64748B" }}>
              {listening
                ? "Listening…"
                : allDone
                ? "Shift log complete"
                : "Tap to log care"}
            </p>
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
                  <span style={{ color: colors.color, fontSize: 16, lineHeight: 1.5 }}>
                    {colors.icon}
                  </span>
                  <div>
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
                onClick={() => setHandoffExpanded(!handoffExpanded)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#1B2B4B" }}
              >
                {handoffExpanded ? "Collapse" : "Full Handoff"}
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
                    🔴 Urgent
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
                    ⚠ Watch
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
                  ✓ Completed
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

              {handoffExpanded && (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    backgroundColor: "#EEF2F8",
                    border: "1px solid #E2E8F0",
                    animation: "fadeIn 0.3s ease-out",
                  }}
                >
                  <p className="font-semibold mb-2" style={{ color: "#1B2B4B" }}>
                    Full Handoff Report
                  </p>
                  <p className="text-xs mb-3" style={{ color: "#64748B" }}>
                    Shift end: {getNow()} · Duration: {shiftTimer}
                  </p>
                  {logs.map((e, i) => (
                    <p key={i} className="py-1" style={{ color: "#1E293B", borderBottom: i < logs.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                      <span className="font-mono text-xs mr-2" style={{ color: "#64748B" }}>{e.time}</span>
                      {e.text}
                    </p>
                  ))}
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
