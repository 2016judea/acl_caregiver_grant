import Anthropic from "@anthropic-ai/sdk";

// The model call is capped below the route's maxDuration so a slow upstream
// returns a 502 the page can show, not a platform timeout it cannot.
export const MODEL_TIMEOUT_MS = 60_000;

// Input caps. The route is unauthenticated and the key is ours, so the body is
// the only thing standing between a stranger and an unbounded prompt.
export const MAX_NOTES = 60;
export const MAX_NOTE_CHARS = 500;
const DEFAULT_LEGAL = 8;

const SYSTEM_PROMPT = `You are CNA Shield, an AI that turns a direct-care worker's raw spoken shift notes into a structured, prioritized end-of-shift handoff for the next caregiver.

You are given: the raw notes a CNA (Certified Nursing Assistant) spoke aloud while working, plus shift metadata (assigned resident count, the shift's ratio, and the legal/target ratio).

Produce a handoff that a busy incoming nurse can read in under a minute and act on. Rules:
1. NEVER invent a vital sign, a name, a room number, a diagnosis, or an event. Use only what is in the notes. If a note is vague, keep it vague.
2. Triage every note into exactly one bucket by clinical urgency:
   - "urgent": something the next caregiver must act on first — a repeated or clearly elevated vital, a change that could signal deterioration, a safety issue, a fall, a refusal of critical care.
   - "watch": a change from baseline or an item to monitor that is not yet urgent.
   - "routine": completed care with no concern.
3. Escalation logic: if the same resident appears with two elevated readings, or a note explicitly says "second" elevated reading, mark it urgent and say why in plain language.
4. Write in plain language a tired human can read fast. No jargon the notes didn't use. Short.
5. For each item, keep the room/resident identifier from the note.
6. Add a one-line "ratio" record from the metadata: whether the shift was over the legal/target ratio, and by how many residents.

Return ONLY a valid JSON object with no markdown fences, no preamble, no explanation:
{"urgent":[{"room":"...","note":"...","why":"..."}],"watch":[{"room":"...","note":"..."}],"routine":[{"room":"...","note":"..."}],"ratio":{"over_limit":true,"assigned":14,"legal":8,"over_by":6,"summary":"..."}}

If a bucket is empty, return an empty array for it.`;

export interface HandoffItem {
  room?: string;
  note: string;
  why?: string;
}
export interface Handoff {
  urgent: HandoffItem[];
  watch: HandoffItem[];
  routine: HandoffItem[];
  ratio: { over_limit: boolean; assigned: number; legal: number; over_by: number; summary: string };
}

export interface HandoffInput {
  notes: string[];
  assigned: number;
  legal: number;
}

/** A function that takes the prompt and returns the model's raw text. Injected so tests never touch the network. */
export type CallModel = (system: string, user: string) => Promise<string>;

let client: Anthropic | null = null;
export const callAnthropic: CallModel = async (system, user) => {
  client ??= new Anthropic({ timeout: MODEL_TIMEOUT_MS, maxRetries: 1 });
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
};

function positiveInt(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : fallback;
}

/** Validate the request body. Returns the cleaned input or the message for a 400. */
export function validateInput(body: unknown): { ok: true; input: HandoffInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "JSON body is required" };
  const { notes, assigned, legal } = body as Record<string, unknown>;
  if (!Array.isArray(notes) || notes.length === 0) {
    return { ok: false, error: "notes (non-empty array) is required" };
  }
  if (notes.length > MAX_NOTES) return { ok: false, error: `notes: at most ${MAX_NOTES} per handoff` };
  const cleaned: string[] = [];
  for (const n of notes) {
    if (typeof n !== "string") return { ok: false, error: "notes: every note must be a string" };
    const t = n.trim();
    if (!t) return { ok: false, error: "notes: a note cannot be empty" };
    if (t.length > MAX_NOTE_CHARS) return { ok: false, error: `notes: a note is at most ${MAX_NOTE_CHARS} characters` };
    cleaned.push(t);
  }
  return {
    ok: true,
    input: {
      notes: cleaned,
      assigned: positiveInt(assigned, cleaned.length),
      legal: positiveInt(legal, DEFAULT_LEGAL),
    },
  };
}

export function buildUserContent({ notes, assigned, legal }: HandoffInput): string {
  return `Shift metadata: ${assigned} residents assigned this shift; legal/target ratio is 1:${legal}.

Raw spoken care notes, in the order they were logged:
${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function items(v: unknown): HandoffItem[] | null {
  if (v == null) return [];
  if (!Array.isArray(v)) return null;
  const out: HandoffItem[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const note = str(r.note);
    if (!note) return null;
    const item: HandoffItem = { note };
    const room = str(r.room);
    const why = str(r.why);
    if (room) item.room = room;
    if (why) item.why = why;
    out.push(item);
  }
  return out;
}

/**
 * Turn the model's raw text into a Handoff, or null if the shape is not one the
 * page can render. The ratio line is recomputed from the request metadata so a
 * model arithmetic slip never reaches the page.
 */
export function parseHandoff(text: string, input: HandoffInput): Handoff | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  const urgent = items(p.urgent);
  const watch = items(p.watch);
  const routine = items(p.routine);
  if (!urgent || !watch || !routine) return null;
  if (urgent.length + watch.length + routine.length === 0) return null;
  const ratioRaw = p.ratio && typeof p.ratio === "object" ? (p.ratio as Record<string, unknown>) : {};
  const over_by = Math.max(0, input.assigned - input.legal);
  const summary =
    str(ratioRaw.summary) ??
    (over_by > 0
      ? `Shift ran 1:${input.assigned} against a 1:${input.legal} limit — ${over_by} residents over.`
      : `Shift ran 1:${input.assigned}, within the 1:${input.legal} limit.`);
  return {
    urgent,
    watch,
    routine,
    ratio: { over_limit: over_by > 0, assigned: input.assigned, legal: input.legal, over_by, summary },
  };
}

export async function handleHandoff(request: Request, callModel: CallModel): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const v = validateInput(body);
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });

  let text: string;
  try {
    text = await callModel(SYSTEM_PROMPT, buildUserContent(v.input));
  } catch (err) {
    console.error("Handoff model error:", err);
    return Response.json({ error: "The handoff service did not answer" }, { status: 502 });
  }

  const handoff = parseHandoff(text, v.input);
  if (!handoff) {
    console.error("Handoff unparseable model output:", text.slice(0, 300));
    return Response.json({ error: "The handoff service returned an unreadable answer" }, { status: 502 });
  }
  return Response.json({ handoff });
}
