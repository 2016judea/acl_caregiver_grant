import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const DEFAULT_NAME = "Margaret";
const DEFAULT_PROFILE = `- Retired schoolteacher, 35 years
- Loves roses and gardening
- Always needed to feel useful and in control
- Husband Robert passed away in 2019
- Has two daughters in their 40s
- Calmed by kitchen activity, talking about her garden
- Agitated by being told she's wrong, loud noises`;

function buildSystemPrompt(name: string, profile: string): string {
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

export async function POST(request: Request) {
  try {
    const { situation, name, profile } = await request.json();

    if (!situation || typeof situation !== "string") {
      return Response.json({ error: "situation is required" }, { status: 400 });
    }

    const careName = typeof name === "string" && name.trim() ? name.trim() : DEFAULT_NAME;
    const careProfile =
      typeof profile === "string" && profile.trim() ? profile.trim() : DEFAULT_PROFILE;

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(careName, careProfile),
        },
      ],
      messages: [
        {
          role: "user",
          content: `The caregiver says: "${situation}"`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No text in response" }, { status: 500 });
    }

    const text = textBlock.text.trim();

    // Extract JSON array — Claude may occasionally wrap in markdown
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ error: "Could not parse response" }, { status: 500 });
    }

    const scripts = JSON.parse(jsonMatch[0]);
    return Response.json({ scripts });
  } catch (err) {
    console.error("Coach API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
