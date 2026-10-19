import Anthropic from "@anthropic-ai/sdk";

// The model call is capped below the route's maxDuration so a slow upstream
// returns a 502 the page can show, not a platform timeout it cannot.
export const MODEL_TIMEOUT_MS = 60_000;

// Input caps. The route is unauthenticated and the key is ours, so the body is
// the only thing standing between a stranger and an unbounded prompt.
export const MAX_SITUATION_CHARS = 2_000;
export const MAX_NAME_CHARS = 80;
export const MAX_PROFILE_CHARS = 4_000;
export const SCRIPT_COUNT = 3;

const DEFAULT_NAME = "Margaret";
const DEFAULT_PROFILE = `- Retired schoolteacher, 35 years
- Loves roses and gardening
- Always needed to feel useful and in control
- Husband Robert passed away in 2019
- Has two daughters in their 40s
- Calmed by kitchen activity, talking about her garden
- Agitated by being told she's wrong, loud noises`;

export function buildSystemPrompt(name: string, profile: string): string {
  return `You are Dementia Coach, an AI that helps family caregivers handle difficult moments using validation therapy — joining the person's emotional reality rather than correcting their factual beliefs.

The care recipient is ${name}:
${profile}

Generate exactly 3 response options for the caregiver. Each should:
1. Be grounded in validation therapy (join, don't correct)
2. Reference ${name}'s specific history and identity from the profile above — never generic dementia advice
3. Be something a non-professional caregiver could say naturally — warm and conversational, not clinical

Return ONLY a valid JSON array with no markdown fences, no preamble, no explanation:
[{"technique":"...","script":"...","explanation":"..."}]

Techniques to draw from: Validation, Reminiscence, Identity Affirmation, Gentle Redirection, Joining Their Reality`;
}

export interface Script {
  technique: string;
  script: string;
  explanation: string;
}

export interface CoachInput {
  situation: string;
  name: string;
  profile: string;
}

/** A function that takes the prompt and returns the model's raw text. Injected so tests never touch the network. */
export type CallModel = (system: string, user: string) => Promise<string>;

let client: Anthropic | null = null;
export const callAnthropic: CallModel = async (system, user) => {
  client ??= new Anthropic({ timeout: MODEL_TIMEOUT_MS, maxRetries: 1 });
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system: [{ type: "text", text: system }],
    messages: [{ role: "user", content: user }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
};

/** Validate the request body. Returns the cleaned input or the message for a 400. */
export function validateInput(body: unknown): { ok: true; input: CoachInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "JSON body is required" };
  const { situation, name, profile } = body as Record<string, unknown>;
  if (typeof situation !== "string" || !situation.trim()) {
    return { ok: false, error: "situation is required" };
  }
  if (situation.trim().length > MAX_SITUATION_CHARS) {
    return { ok: false, error: `situation is at most ${MAX_SITUATION_CHARS} characters` };
  }
  if (typeof name === "string" && name.trim().length > MAX_NAME_CHARS) {
    return { ok: false, error: `name is at most ${MAX_NAME_CHARS} characters` };
  }
  if (typeof profile === "string" && profile.trim().length > MAX_PROFILE_CHARS) {
    return { ok: false, error: `profile is at most ${MAX_PROFILE_CHARS} characters` };
  }
  return {
    ok: true,
    input: {
      situation: situation.trim(),
      name: typeof name === "string" && name.trim() ? name.trim() : DEFAULT_NAME,
      profile: typeof profile === "string" && profile.trim() ? profile.trim() : DEFAULT_PROFILE,
    },
  };
}

export function buildUserContent({ situation }: CoachInput): string {
  return `The caregiver says: "${situation}"`;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Turn the model's raw text into exactly SCRIPT_COUNT scripts, or null if the
 * shape is not one the page can render (the page reads .technique/.script/.explanation
 * of every entry, so a stray string or a missing field would blank a card).
 */
export function parseScripts(text: string): Script[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const out: Script[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const technique = str(r.technique);
    const script = str(r.script);
    const explanation = str(r.explanation) ?? "";
    if (!technique || !script) continue;
    out.push({ technique, script, explanation });
    if (out.length === SCRIPT_COUNT) break;
  }
  return out.length === 0 ? null : out;
}

export async function handleCoach(request: Request, callModel: CallModel): Promise<Response> {
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
    text = await callModel(buildSystemPrompt(v.input.name, v.input.profile), buildUserContent(v.input));
  } catch (err) {
    console.error("Coach model error:", err);
    return Response.json({ error: "The coaching service did not answer" }, { status: 502 });
  }

  const scripts = parseScripts(text);
  if (!scripts) {
    console.error("Coach unparseable model output:", text.slice(0, 300));
    return Response.json({ error: "The coaching service returned an unreadable answer" }, { status: 502 });
  }
  return Response.json({ scripts });
}
