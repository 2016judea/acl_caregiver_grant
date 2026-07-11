"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <header className="px-6 py-4" style={{ backgroundColor: "#1B2B4B" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white">CNA Shield</span>
            <span className="ml-3 text-sm hidden sm:inline" style={{ color: "#94A3B8" }}>
              Voice-first care documentation
            </span>
          </div>
          <Link
            href="/demo"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#16A34A" }}
          >
            Try the demo →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p
          className="text-xs uppercase tracking-widest mb-6 text-center"
          style={{ color: "#64748B" }}
        >
          A night every CNA knows
        </p>

        {/* BEFORE card */}
        <div
          className="rounded-2xl p-8 mb-8 text-white"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ backgroundColor: "#243660" }}
            >
              11:47 PM
            </span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Floor 3 · 14 residents · 1 CNA
            </span>
          </div>

          <p className="text-xl leading-relaxed mb-5">
            Marcus has checked on 14 residents. Two have elevated blood pressure.
            One is showing new confusion. He&rsquo;s logged none of it — there&rsquo;s no time.
          </p>

          <div
            className="border-l-2 pl-5 italic mb-5"
            style={{ borderColor: "#DC2626", opacity: 0.9, color: "#FCA5A5" }}
          >
            At shift end, the paper log is blank. The next nurse reads nothing.
            Mr. Davis&rsquo;s second elevated BP goes unnoticed until morning.
          </div>

          <p style={{ color: "#94A3B8" }} className="leading-relaxed">
            Documentation takes time Marcus doesn&rsquo;t have. The ratio is 1:14.
            The legal limit is 1:8. Nobody is counting.
          </p>
        </div>

        {!revealed ? (
          <div className="text-center mb-8">
            <button
              onClick={() => setRevealed(true)}
              className="px-8 py-4 rounded-xl text-lg font-medium text-white transition-all hover:opacity-90 hover:scale-105 shadow-md"
              style={{ backgroundColor: "#16A34A" }}
            >
              → See how CNA Shield changes this
            </button>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* AFTER card */}
            <div
              className="rounded-2xl p-8 mb-8"
              style={{ backgroundColor: "#EEF2F8" }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-5"
                style={{ color: "#64748B" }}
              >
                Marcus taps the mic as he leaves each room.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { time: "10:14 PM", text: "Room 306 — repositioned to right side, incontinence care complete", color: "#16A34A" },
                  { time: "10:31 PM", text: "Room 312 — resident appears more confused than baseline, noted for monitoring", color: "#D97706" },
                  { time: "10:45 PM", text: "Room 308 — BP 142/88, elevated, flagged", color: "#D97706" },
                  { time: "11:02 PM", text: "Room 301: Mr. Davis — BP 156/94, second elevated reading this shift", color: "#DC2626" },
                ].map((entry, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl px-4 py-3 flex items-start gap-3"
                    style={{
                      border: "1px solid #E2E8F0",
                      animation: `slideIn 0.3s ease-out ${i * 0.1}s both`,
                    }}
                  >
                    <span style={{ color: entry.color, fontSize: 18, lineHeight: 1.4 }}>✓</span>
                    <div>
                      <span className="text-xs font-mono mr-2" style={{ color: "#64748B" }}>
                        {entry.time}
                      </span>
                      <span style={{ color: "#1E293B" }}>{entry.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Handoff preview */}
              <div
                className="bg-white rounded-xl p-5"
                style={{ border: "1px solid #E2E8F0" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>
                  Shift handoff — auto-generated
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#DC2626" }}>🔴</span>
                    <span><strong>URGENT:</strong> Mr. Davis (301) — BP elevated twice this shift (142/88, then 156/94)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#D97706" }}>⚠️</span>
                    <span><strong>WATCH:</strong> Room 312 — confusion above baseline, monitor overnight</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#16A34A" }}>✓</span>
                    <span>14 residents checked, all repositioned per schedule</span>
                  </div>
                  <div
                    className="mt-3 pt-3 text-xs"
                    style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}
                  >
                    Ratio logged: 1:14 · Legal limit: 1:8 · Submitted to registry
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/demo"
                className="inline-block px-10 py-4 rounded-xl text-lg font-medium text-white transition-all hover:opacity-90 hover:scale-105 shadow-md"
                style={{ backgroundColor: "#16A34A" }}
              >
                → Try a simulated shift
              </Link>
              <p className="mt-3 text-sm" style={{ color: "#64748B" }}>
                Tap the mic, watch the log build, see the handoff auto-generate
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
