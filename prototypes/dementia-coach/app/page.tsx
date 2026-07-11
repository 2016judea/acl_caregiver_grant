"use client";

import { useState } from "react";

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

function ProfileCard() {
  return (
    <div
      className="rounded-2xl p-6 h-fit sticky top-6"
      style={{ backgroundColor: "#F0EDE6", border: "1px solid #E8E2D9" }}
    >
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ backgroundColor: "#E8E2D9" }}
        >
          👵
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>
            Margaret
          </h2>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>
            79 · Mid-stage Alzheimer&rsquo;s
          </p>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7A9E7E" }}>
        Who she was
      </p>
      <ul className="space-y-2 text-sm" style={{ color: "#2C2C2C" }}>
        {[
          "Retired schoolteacher, 35 years",
          "Loved gardening — roses especially",
          "Always the one who 'held everything together'",
          "Husband: Robert, passed 2019",
          "Two daughters, both in their 40s",
        ].map((item) => (
          <li key={item} className="flex gap-2">
            <span style={{ color: "#7A9E7E", flexShrink: 0 }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-5" style={{ borderTop: "1px solid #E8E2D9" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7A9E7E" }}>
          Calmed by
        </p>
        <p className="text-sm" style={{ color: "#2C2C2C" }}>
          Kitchen activity, talking about her garden
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-3" style={{ color: "#C0605A" }}>
          Agitated by
        </p>
        <p className="text-sm" style={{ color: "#2C2C2C" }}>
          Being told she&rsquo;s wrong, loud noises
        </p>
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
      className="bg-white rounded-xl p-5 shadow-sm"
      style={{
        borderLeft: "4px solid #7A9E7E",
        animation: `fadeInUp 0.4s ease-out ${index * 0.12}s both`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A9E7E" }}>
          {script.technique}
        </p>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1 rounded-full flex-shrink-0 transition-all"
          style={{
            backgroundColor: copied ? "#7A9E7E" : "#F0EDE6",
            color: copied ? "#fff" : "#6B6B6B",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="italic mb-3 leading-relaxed" style={{ color: "#2C2C2C" }}>
        &ldquo;{script.script}&rdquo;
      </p>
      <p className="text-sm" style={{ color: "#6B6B6B" }}>
        {script.explanation}
      </p>
    </div>
  );
}

export default function Home() {
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState("");

  async function generateScripts() {
    if (!situation.trim()) return;
    setLoading(true);
    setScripts([]);
    setError("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setScripts(data.scripts);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePreset(preset: string) {
    setSituation(preset);
    setScripts([]);
    setError("");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <header className="px-6 py-4" style={{ borderBottom: "1px solid #E8E2D9" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>
            Dementia Coach
          </p>
          <p className="text-sm hidden sm:block" style={{ color: "#6B6B6B" }}>
            Margaret&rsquo;s profile is pre-loaded
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Profile panel */}
          <div className="md:col-span-2">
            <ProfileCard />
          </div>

          {/* Coaching interface */}
          <div className="md:col-span-3 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#2C2C2C" }}>
                Describe what&rsquo;s happening right now
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. She keeps asking where her mother is. She's very upset."
                className="w-full rounded-xl p-4 text-base resize-none focus:outline-none transition-shadow"
                rows={3}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #E8E2D9",
                  color: "#2C2C2C",
                }}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "0 0 0 2px #7A9E7E44")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Or try a common scenario
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePreset(preset)}
                    className="text-left text-sm px-4 py-3 rounded-xl transition-all hover:opacity-80"
                    style={{
                      backgroundColor: situation === preset ? "#7A9E7E" : "#F0EDE6",
                      color: situation === preset ? "#fff" : "#2C2C2C",
                      border: "1px solid #E8E2D9",
                    }}
                  >
                    &ldquo;{preset}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generateScripts}
              disabled={!situation.trim() || loading}
              className="w-full py-4 rounded-xl text-lg font-medium text-white transition-all"
              style={{
                backgroundColor: !situation.trim() || loading ? "#B8CEB9" : "#7A9E7E",
                cursor: !situation.trim() || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Finding the right words…" : "Generate Scripts"}
            </button>

            {/* Loading indicator */}
            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                  <span style={{ animation: "pulse-soft 1.5s ease-in-out infinite" }}>
                    ✦
                  </span>
                  Personalizing for Margaret…
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-center" style={{ color: "#C0605A" }}>
                {error}
              </p>
            )}

            {/* Script cards */}
            {scripts.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
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
