import { callAnthropic, handleCoach } from "./lib";

// Vercel function budget; the model call inside is capped at MODEL_TIMEOUT_MS (lib.ts).
export const maxDuration = 90;

export async function POST(request: Request) {
  return handleCoach(request, callAnthropic);
}
