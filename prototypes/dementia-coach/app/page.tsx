"use client";

import { useRef, useState } from "react";
import Link from "next/link";

interface Script {
  technique: string;
  script: string;
  explanation: string;
}

const PRESETS = [
  "She thinks she needs to pick up her kids from school",
  "She's asking where Robert is",
  "She's refusing to take her bath",
  "She's very agitated and wants to 'go home'",
];

const TECHNIQUE_ICONS: Record<string, string> = {
  Validation: "✓",
  Reminiscence: "◐",
  "Identity Affirmation": "★",
  "Gentle Redirection": "→",
  "Joining Their Reality": "◎",
};

function LogoMark() {
  return (
    <div className="relative w-[26px] h-[26px] flex-shrink-0">
      <span
        className="absolute top-0 left-0 w-4 h-4 rounded-full"
        style={{ backgroundColor: "var(--color-teal)", opacity: 0.85 }}
      />
      <span
        className="absolute bottom-0 right-0 w-4 h-4 rounded-full"
        style={{ backgroundColor: "var(--color-coral)", opacity: 0.7 }}
      />
    </div>
  );
}

function ProfileCard() {
  return (
    <div
      className="rounded-2xl p-5 h-fit sticky top-6 shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="w-13 h-13 rounded-xl flex items-center justify-center text-lg font-bold mb-3"
        style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)", width: 52, height: 52 }}
      >
        M
      </div>
      <h2 className="text-[19px] font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
        Margaret
      </h2>
      <span
        className="inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mt-1.5"
        style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)" }}
      >
        79 · Mid-stage Alzheimer&rsquo;s
      </span>

      <p
        className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2"
        style={{ color: "var(--color-ink-muted)" }}
      >
        Who she was
      </p>
      <ul className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--color-ink)" }}>
        {[
          "Retired schoolteacher, 35 years",
          "Loved gardening — roses especially",
          "Always the one who 'held everything together'",
          "Husband: Robert, passed 2019",
          "Two daughters, both in their 40s",
        ].map((item) => (
          <li key={item} className="relative pl-3.5">
            <span
              className="absolute left-0 top-[7px] w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: "var(--color-teal)" }}
            />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 mt-4">
        <div className="rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-ink)" }}>
          <b className="block text-[11px] uppercase tracking-wide mb-0.5 opacity-75">Calmed by</b>
          Kitchen activity, talking about her garden
        </div>
        <div className="rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: "var(--color-coral-soft)", color: "var(--color-ink)" }}>
          <b className="block text-[11px] uppercase tracking-wide mb-0.5 opacity-75">Agitated by</b>
          Being told she&rsquo;s wrong, loud noises
        </div>
      </div>
    </div>
  );
}

function ScriptCard({ script, index }: { script: Script; index: number }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(script.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex gap-3 rounded-2xl p-4 shadow-sm"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        animation: `fadeInUp 0.35s ease-out ${index * 0.08}s both`,
      }}
    >
      <div
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px] flex-shrink-0"
        style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)" }}
      >
        {TECHNIQUE_ICONS[script.technique] ?? "•"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-teal)" }}>
            {script.technique}
          </p>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded-full flex-shrink-0 transition-all font-medium"
            style={{
              backgroundColor: copied ? "var(--color-teal)" : "var(--color-teal-soft)",
              color: copied ? "#fff" : "var(--color-teal)",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p
          className="mb-2 leading-relaxed text-[17px]"
          style={{ color: "var(--color-ink)", fontFamily: '"Iowan Old Style", Palatino, Georgia, serif' }}
        >
          &ldquo;{script.script}&rdquo;
        </p>
        <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
          {script.explanation}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState("");
  // Bumped on every generate and every situation change; a response for an older request is dropped.
  const requestRef = useRef(0);

  async function generateScripts() {
    if (!situation.trim()) return;
    setLoading(true);
    setScripts([]);
    setError("");
    const request = ++requestRef.current;
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      // The situation or persona changed while this was in flight: these scripts belong to the old one.
      if (request !== requestRef.current) return;
      setScripts(Array.isArray(data.scripts) ? data.scripts : []);
    } catch {
      if (request === requestRef.current) setError("Something went wrong. Please try again.");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  function handlePreset(preset: string) {
    requestRef.current += 1;
    setSituation(preset);
    setScripts([]);
    setError("");
    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header className="px-6 py-4" style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Dementia Coach
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm hidden sm:block" style={{ color: "var(--color-ink-muted)" }}>
              Margaret&rsquo;s profile is pre-loaded
            </p>
            <Link
              href="/demo"
              className="text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)" }}
            >
              Try another persona →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Profile panel */}
          <div className="md:col-span-2">
            <ProfileCard />
          </div>

          {/* Coaching interface */}
          <div className="md:col-span-3 space-y-5">
            <div>
              <label htmlFor="situation" className="block text-sm font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
                Describe what&rsquo;s happening right now
              </label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. She keeps asking where her mother is. She's very upset."
                className="w-full rounded-2xl p-4 text-base resize-none focus:outline-none transition-shadow"
                rows={3}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-ink)",
                }}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--color-teal) 20%, transparent)")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ink-muted)" }}>
                Or try a common scenario
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePreset(preset)}
                    aria-pressed={situation === preset}
                    className="text-left text-sm px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                    style={{
                      backgroundColor: situation === preset ? "var(--color-teal)" : "var(--color-surface)",
                      color: situation === preset ? "#fff" : "var(--color-ink)",
                      border: `1px solid ${situation === preset ? "var(--color-teal)" : "var(--color-border)"}`,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generateScripts}
              disabled={!situation.trim() || loading}
              className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all"
              style={{
                backgroundColor: !situation.trim() || loading ? "color-mix(in srgb, var(--color-teal) 35%, var(--color-surface))" : "var(--color-teal)",
                cursor: !situation.trim() || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Finding the right words…" : "Generate scripts"}
            </button>

            <p role="status" aria-live="polite" className="sr-only">
              {loading ? "Finding the right words" : error ? error : scripts.length > 0 ? "Three response options are ready" : ""}
            </p>

            {/* Loading skeleton */}
            {loading && (
              <div className="flex flex-col gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="h-[62px] rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--color-surface) 0%, var(--color-border) 50%, var(--color-surface) 100%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.2s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-center" style={{ color: "var(--color-coral)" }}>
                {error}
              </p>
            )}

            {/* Script cards */}
            {scripts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-muted)" }}>
                  3 response options for Margaret
                </p>
                {scripts.map((script, i) => (
                  <ScriptCard key={i} script={script} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
