"use client";

import { useState } from "react";
import Link from "next/link";

interface Script {
  technique: string;
  script: string;
  explanation: string;
}

interface Persona {
  id: string;
  name: string;
  meta: string;
  icon: string;
  bio: string[];
  calmedBy: string;
  agitatedBy: string;
  profile: string; // bullet block sent to the API
  presets: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "margaret",
    name: "Margaret",
    meta: "79 · Mid-stage Alzheimer's",
    icon: "👵",
    bio: [
      "Retired schoolteacher, 35 years",
      "Loved gardening — roses especially",
      "Always the one who 'held everything together'",
      "Husband: Robert, passed 2019",
      "Two daughters, both in their 40s",
    ],
    calmedBy: "Kitchen activity, talking about her garden",
    agitatedBy: "Being told she's wrong, loud noises",
    profile: `- Retired schoolteacher, 35 years
- Loves roses and gardening
- Always needed to feel useful and in control
- Husband Robert passed away in 2019
- Has two daughters in their 40s
- Calmed by kitchen activity, talking about her garden
- Agitated by being told she's wrong, loud noises`,
    presets: [
      "She thinks she needs to pick up her kids from school",
      "She's asking where Robert is",
      "She's refusing to take her bath",
      "She's very agitated and wants to 'go home'",
    ],
  },
  {
    id: "james",
    name: "James",
    meta: "82 · Vascular dementia",
    icon: "👴",
    bio: [
      "Auto mechanic, ran his own shop 40 years",
      "Korean War veteran, took pride in providing",
      "Loves tinkering, old cars, Tigers baseball",
      "Wife Dorothy is still living, married 58 years",
      "One son, a long-haul trucker",
    ],
    calmedBy: "Having a task or a tool in his hands, talking cars",
    agitatedBy: "Feeling helpless, being fussed over, losing control",
    profile: `- Ran his own auto-repair shop for 40 years, master mechanic
- Korean War veteran; his identity is built on providing and fixing things
- Loves tinkering, old cars, and Detroit Tigers baseball
- Wife Dorothy is still living; married 58 years
- Has one son who drives long-haul trucks
- Calmed by having a task or a tool in his hands, and talking about cars
- Agitated by feeling helpless, being fussed over, or losing control`,
    presets: [
      "He's trying to leave to open up the shop",
      "He's asking where Dorothy is and getting anxious",
      "He won't let me help him get dressed",
      "He's frustrated and says he's useless now",
    ],
  },
];

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

export default function DemoPage() {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const persona = PERSONAS.find((p) => p.id === personaId)!;

  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [profileText, setProfileText] = useState(persona.profile);

  function selectPersona(id: string) {
    const p = PERSONAS.find((x) => x.id === id)!;
    setPersonaId(id);
    setProfileText(p.profile);
    setSituation("");
    setScripts([]);
    setError("");
  }

  async function generateScripts() {
    if (!situation.trim()) return;
    setLoading(true);
    setScripts([]);
    setError("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, name: persona.name, profile: profileText }),
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <header className="px-6 py-4" style={{ borderBottom: "1px solid #E8E2D9" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>
            ← Dementia Coach
          </Link>
          <p className="text-sm hidden sm:block" style={{ color: "#6B6B6B" }}>
            The same tool, personalized to whoever you&rsquo;re caring for
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Persona switcher */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
            Who are you caring for?
          </p>
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPersona(p.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: p.id === personaId ? "#7A9E7E" : "#F0EDE6",
                  color: p.id === personaId ? "#fff" : "#2C2C2C",
                  border: "1px solid #E8E2D9",
                }}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "#8A8A8A" }}>
            Same AI, no code change — it reads the profile below. Edit it and the guidance changes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Profile panel */}
          <div className="md:col-span-2">
            <div
              className="rounded-2xl p-6 h-fit sticky top-6"
              style={{ backgroundColor: "#F0EDE6", border: "1px solid #E8E2D9" }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: "#E8E2D9" }}
                >
                  {persona.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>
                    {persona.name}
                  </h2>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>
                    {persona.meta}
                  </p>
                </div>
              </div>

              {!editing ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7A9E7E" }}>
                    Who they were
                  </p>
                  <ul className="space-y-2 text-sm" style={{ color: "#2C2C2C" }}>
                    {persona.bio.map((item) => (
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
                    <p className="text-sm" style={{ color: "#2C2C2C" }}>{persona.calmedBy}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-3" style={{ color: "#C0605A" }}>
                      Agitated by
                    </p>
                    <p className="text-sm" style={{ color: "#2C2C2C" }}>{persona.agitatedBy}</p>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-5 text-xs font-medium underline"
                    style={{ color: "#7A9E7E" }}
                  >
                    Edit this profile
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7A9E7E" }}>
                    Profile the AI reads
                  </p>
                  <textarea
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    rows={9}
                    className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none"
                    style={{ backgroundColor: "#fff", border: "1px solid #E8E2D9", color: "#2C2C2C" }}
                  />
                  <p className="text-xs mt-2" style={{ color: "#8A8A8A" }}>
                    Change anything — a hobby, a name, a fear — then generate. The scripts follow the profile.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs font-medium underline"
                      style={{ color: "#7A9E7E" }}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setProfileText(persona.profile)}
                      className="text-xs font-medium underline"
                      style={{ color: "#8A8A8A" }}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
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
                placeholder="e.g. He keeps asking where his wife is. He's getting anxious."
                className="w-full rounded-xl p-4 text-base resize-none focus:outline-none transition-shadow"
                rows={3}
                style={{ backgroundColor: "#fff", border: "1px solid #E8E2D9", color: "#2C2C2C" }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #7A9E7E44")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Or try a common scenario
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {persona.presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSituation(preset);
                      setScripts([]);
                      setError("");
                    }}
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

            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                  <span style={{ animation: "pulse-soft 1.5s ease-in-out infinite" }}>✦</span>
                  Personalizing for {persona.name}…
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-center" style={{ color: "#C0605A" }}>
                {error}
              </p>
            )}

            {scripts.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
                  3 response options for {persona.name}
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
