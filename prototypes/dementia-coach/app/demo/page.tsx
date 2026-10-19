"use client";

import { useRef, useState } from "react";
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
  initials: string;
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
    initials: "M",
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
    initials: "J",
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

export default function DemoPage() {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const persona = PERSONAS.find((p) => p.id === personaId)!;

  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [profileText, setProfileText] = useState(persona.profile);
  // Bumped on every generate and every persona/situation change; a response for an older request is dropped,
  // so Margaret's scripts can never land under James's name.
  const requestRef = useRef(0);

  function selectPersona(id: string) {
    const p = PERSONAS.find((x) => x.id === id)!;
    requestRef.current += 1;
    setPersonaId(id);
    setProfileText(p.profile);
    setSituation("");
    setScripts([]);
    setError("");
    setLoading(false);
  }

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
        body: JSON.stringify({ situation, name: persona.name, profile: profileText }),
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header className="px-6 py-4" style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
              <span aria-hidden="true">← </span>Dementia Coach
            </h1>
          </Link>
          <p className="text-sm hidden sm:block" style={{ color: "var(--color-ink-muted)" }}>
            The same tool, personalized to whoever you&rsquo;re caring for
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Persona switcher */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Who are you caring for?
          </p>
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPersona(p.id)}
                aria-pressed={p.id === personaId}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: p.id === personaId ? "var(--color-teal)" : "var(--color-surface)",
                  color: p.id === personaId ? "#fff" : "var(--color-ink)",
                  border: `1px solid ${p.id === personaId ? "var(--color-teal)" : "var(--color-border)"}`,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-ink-muted)" }}>
            Same AI, no code change — it reads the profile below. Edit it and the guidance changes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Profile panel */}
          <div className="md:col-span-2">
            <div
              className="rounded-2xl p-5 h-fit sticky top-6 shadow-sm"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="rounded-xl flex items-center justify-center text-lg font-bold mb-3"
                style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)", width: 52, height: 52 }}
              >
                {persona.initials}
              </div>
              <h2 className="text-[19px] font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
                {persona.name}
              </h2>
              <span
                className="inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mt-1.5"
                style={{ backgroundColor: "var(--color-teal-soft)", color: "var(--color-teal)" }}
              >
                {persona.meta}
              </span>

              {!editing ? (
                <>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2"
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    Who they were
                  </p>
                  <ul className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--color-ink)" }}>
                    {persona.bio.map((item) => (
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
                      {persona.calmedBy}
                    </div>
                    <div className="rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: "var(--color-coral-soft)", color: "var(--color-ink)" }}>
                      <b className="block text-[11px] uppercase tracking-wide mb-0.5 opacity-75">Agitated by</b>
                      {persona.agitatedBy}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-4 text-xs font-semibold underline"
                    style={{ color: "var(--color-teal)" }}
                  >
                    Edit this profile
                  </button>
                </>
              ) : (
                <>
                  <label
                    htmlFor="profile-text"
                    className="block text-[11px] font-bold uppercase tracking-wider mt-4 mb-2"
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    Profile the AI reads
                  </label>
                  <textarea
                    id="profile-text"
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    rows={9}
                    className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-ink)" }}
                  />
                  <p className="text-xs mt-2" style={{ color: "var(--color-ink-muted)" }}>
                    Change anything — a hobby, a name, a fear — then generate. The scripts follow the profile.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs font-semibold underline"
                      style={{ color: "var(--color-teal)" }}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setProfileText(persona.profile)}
                      className="text-xs font-semibold underline"
                      style={{ color: "var(--color-ink-muted)" }}
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
              <label htmlFor="situation" className="block text-sm font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
                Describe what&rsquo;s happening right now
              </label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. He keeps asking where his wife is. He's getting anxious."
                className="w-full rounded-2xl p-4 text-base resize-none focus:outline-none transition-shadow"
                rows={3}
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-ink)" }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--color-teal) 20%, transparent)")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ink-muted)" }}>
                Or try a common scenario
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {persona.presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      requestRef.current += 1;
                      setSituation(preset);
                      setScripts([]);
                      setError("");
                      setLoading(false);
                    }}
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

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--color-coral)" }}>
                {error}
              </p>
            )}

            {scripts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-muted)" }}>
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
