import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleHandoff,
  parseHandoff,
  validateInput,
  MAX_NOTES,
  MAX_NOTE_CHARS,
  type CallModel,
} from "../app/api/handoff/lib";

function post(body: unknown, raw = false): Request {
  return new Request("http://local/api/handoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const GOOD_MODEL_TEXT = JSON.stringify({
  urgent: [{ room: "301", note: "BP 156/94, second elevated reading", why: "repeat elevated vital" }],
  watch: [{ room: "312", note: "more confused than baseline" }],
  routine: [{ room: "306", note: "repositioned, incontinence care done" }],
  ratio: { over_limit: true, assigned: 14, legal: 8, over_by: 6, summary: "Shift ran 1:14 against 1:8 — 6 over." },
});

const neverCalled: CallModel = async () => {
  throw new Error("model must not be called for a rejected body");
};

test("a malformed JSON body is a 400, not a 500", async () => {
  const res = await handleHandoff(post("{not json", true), neverCalled);
  assert.equal(res.status, 400);
});

test("notes must be a non-empty array of non-empty strings", async () => {
  for (const body of [{}, { notes: [] }, { notes: "x" }, { notes: [""] }, { notes: ["   "] }, { notes: [{ text: "Room 1" }] }, { notes: [null] }]) {
    const res = await handleHandoff(post(body), neverCalled);
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
  }
});

test("oversized bodies never reach the model", async () => {
  const tooMany = { notes: Array.from({ length: MAX_NOTES + 1 }, (_, i) => `Room ${i} fine`) };
  assert.equal((await handleHandoff(post(tooMany), neverCalled)).status, 400);
  const tooLong = { notes: ["x".repeat(MAX_NOTE_CHARS + 1)] };
  assert.equal((await handleHandoff(post(tooLong), neverCalled)).status, 400);
});

test("assigned/legal fall back to sane defaults on junk", () => {
  const v = validateInput({ notes: ["a", "b", "c"], assigned: -3, legal: "8" });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.input.assigned, 3);
    assert.equal(v.input.legal, 8);
  }
  const v2 = validateInput({ notes: ["a"], assigned: 0, legal: 0 });
  assert.ok(v2.ok && v2.input.legal === 8 && v2.input.assigned === 1);
});

test("a good model answer round-trips, with the prompt carrying the notes in order", async () => {
  let seenUser = "";
  const model: CallModel = async (_system, user) => {
    seenUser = user;
    return "Here you go:\n" + GOOD_MODEL_TEXT;
  };
  const res = await handleHandoff(post({ notes: [" first ", "second"], assigned: 14, legal: 8 }), model);
  assert.equal(res.status, 200);
  const { handoff } = await res.json();
  assert.equal(handoff.urgent[0].room, "301");
  assert.equal(handoff.ratio.over_by, 6);
  assert.match(seenUser, /1\. first\n2\. second/);
  assert.match(seenUser, /14 residents assigned/);
});

test("the ratio line is computed from the request, not copied from the model", () => {
  const wrongMath = GOOD_MODEL_TEXT.replace('"over_by":6', '"over_by":60').replace('"assigned":14', '"assigned":99');
  const h = parseHandoff(wrongMath, { notes: ["a"], assigned: 14, legal: 8 });
  assert.ok(h);
  assert.deepEqual([h!.ratio.assigned, h!.ratio.legal, h!.ratio.over_by, h!.ratio.over_limit], [14, 8, 6, true]);
  const within = parseHandoff(GOOD_MODEL_TEXT.replace(/"summary":"[^"]*"/, '"summary":""'), { notes: ["a"], assigned: 6, legal: 8 });
  assert.equal(within!.ratio.over_limit, false);
  assert.match(within!.ratio.summary, /within/);
});

test("a model answer the page cannot render is a 502, never a 200 with a crashing payload", async () => {
  const bad = [
    "I'm sorry, I can't help with that.",
    '{"urgent":"Room 301 is bad","watch":[],"routine":[]}', // bucket is a string: page would call .map on it
    '{"urgent":[{"room":"301"}],"watch":[],"routine":[]}', // item with no note
    '{"urgent":[],"watch":[],"routine":[]}', // nothing triaged at all
    "[]",
    '{"urgent":[{"note":"x"}',
  ];
  for (const text of bad) {
    const res = await handleHandoff(post({ notes: ["Room 301 BP 156/94"] }), async () => text);
    assert.equal(res.status, 502, `expected 502 for ${text}`);
  }
});

test("missing buckets are empty arrays and blank fields are dropped", () => {
  const h = parseHandoff('{"urgent":[{"room":"","note":" fall ","why":""}]}', { notes: ["a"], assigned: 1, legal: 8 });
  assert.deepEqual(h!.urgent, [{ note: "fall" }]);
  assert.deepEqual(h!.watch, []);
  assert.deepEqual(h!.routine, []);
});

test("a model error is a 502 with a message the page can show", async () => {
  const res = await handleHandoff(post({ notes: ["x"] }), async () => {
    throw new Error("upstream timeout");
  });
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.ok(typeof body.error === "string" && body.error.length > 0);
});
