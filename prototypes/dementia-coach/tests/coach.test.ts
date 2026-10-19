import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleCoach,
  parseScripts,
  validateInput,
  MAX_SITUATION_CHARS,
  MAX_PROFILE_CHARS,
  type CallModel,
} from "../app/api/coach/lib";

function post(body: unknown, raw = false): Request {
  return new Request("http://local/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const GOOD = JSON.stringify([
  { technique: "Validation", script: "Tell me about the kids.", explanation: "Joins the feeling." },
  { technique: "Reminiscence", script: "Which class was your favourite?", explanation: "Reaches for identity." },
  { technique: "Gentle Redirection", script: "Let's check the roses.", explanation: "Moves toward calm." },
]);

const neverCalled: CallModel = async () => {
  throw new Error("model must not be called for a rejected body");
};

test("a malformed JSON body is a 400, not a 500", async () => {
  assert.equal((await handleCoach(post("{nope", true), neverCalled)).status, 400);
});

test("situation must be a non-blank string", async () => {
  for (const body of [{}, { situation: "" }, { situation: "   " }, { situation: 42 }, { situation: ["x"] }]) {
    assert.equal((await handleCoach(post(body), neverCalled)).status, 400, JSON.stringify(body));
  }
});

test("oversized bodies never reach the model", async () => {
  assert.equal((await handleCoach(post({ situation: "x".repeat(MAX_SITUATION_CHARS + 1) }), neverCalled)).status, 400);
  assert.equal(
    (await handleCoach(post({ situation: "ok", profile: "p".repeat(MAX_PROFILE_CHARS + 1) }), neverCalled)).status,
    400,
  );
  assert.equal((await handleCoach(post({ situation: "ok", name: "n".repeat(81) }), neverCalled)).status, 400);
});

test("blank name/profile fall back to Margaret; a given profile reaches the system prompt", async () => {
  const v = validateInput({ situation: "She wants to go home", name: "  ", profile: "" });
  assert.ok(v.ok && v.input.name === "Margaret" && /schoolteacher/.test(v.input.profile));

  let seenSystem = "";
  const model: CallModel = async (system) => {
    seenSystem = system;
    return GOOD;
  };
  const res = await handleCoach(post({ situation: "He wants to open the shop", name: "James", profile: "- Mechanic 40 years" }), model);
  assert.equal(res.status, 200);
  assert.match(seenSystem, /The care recipient is James:\n- Mechanic 40 years/);
  assert.doesNotMatch(seenSystem, /schoolteacher/);
});

test("a good answer round-trips as exactly three scripts, even if the model sends five or wraps it in prose", async () => {
  const five = JSON.parse(GOOD).concat([
    { technique: "Validation", script: "Four.", explanation: "" },
    { technique: "Validation", script: "Five.", explanation: "" },
  ]);
  const res = await handleCoach(post({ situation: "x" }), async () => "Sure:\n```json\n" + JSON.stringify(five) + "\n```");
  assert.equal(res.status, 200);
  const { scripts } = await res.json();
  assert.equal(scripts.length, 3);
  assert.equal(scripts[0].script, "Tell me about the kids.");
});

test("a model answer the page cannot render is a 502, never a 200 with a crashing payload", async () => {
  const bad = [
    "I'm sorry, I can't help with that.",
    '["say this","say that"]', // bare strings: page would render .script as undefined
    '[{"technique":"Validation"}]', // no script text
    "[]",
    '[{"technique":"Validation","script":"x"',
  ];
  for (const text of bad) {
    const res = await handleCoach(post({ situation: "x" }), async () => text);
    assert.equal(res.status, 502, `expected 502 for ${text}`);
  }
});

test("an array wrapped in an object is still found", () => {
  const s = parseScripts('{"scripts":[{"technique":"Validation","script":"x"}]}');
  assert.equal(s?.[0].script, "x");
});

test("entries missing an explanation still render; entries missing a script are skipped", () => {
  const s = parseScripts('[{"technique":"Validation","script":"Hi"},{"technique":"X"},{"technique":"Y","script":" there "}]');
  assert.deepEqual(s, [
    { technique: "Validation", script: "Hi", explanation: "" },
    { technique: "Y", script: "there", explanation: "" },
  ]);
});

test("a model error is a 502 with a message the page can show", async () => {
  const res = await handleCoach(post({ situation: "x" }), async () => {
    throw new Error("upstream timeout");
  });
  assert.equal(res.status, 502);
  assert.ok(typeof (await res.json()).error === "string");
});
