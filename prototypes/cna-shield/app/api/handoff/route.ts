import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

export async function POST(request: Request) {
  try {
    const { notes, assigned, legal } = await request.json();

    if (!Array.isArray(notes) || notes.length === 0) {
      return Response.json({ error: "notes (non-empty array) is required" }, { status: 400 });
    }

    const assignedCount = typeof assigned === "number" ? assigned : notes.length;
    const legalCount = typeof legal === "number" ? legal : 8;

    const userContent = `Shift metadata: ${assignedCount} residents assigned this shift; legal/target ratio is 1:${legalCount}.

Raw spoken care notes, in the order they were logged:
${notes.map((n: string, i: number) => `${i + 1}. ${n}`).join("\n")}`;

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No text in response" }, { status: 500 });
    }

    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Could not parse response" }, { status: 500 });
    }

    const handoff = JSON.parse(jsonMatch[0]);
    return Response.json({ handoff });
  } catch (err) {
    console.error("Handoff API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
