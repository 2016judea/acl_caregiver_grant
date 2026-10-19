// Section 508 is the grant's premise, so the shipped markup is checked for the
// basics a screen reader needs: one h1, a name on every button, a label on
// every field, a live region for async state, and the analytics tag on the layout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import Home from "../app/page";
import DemoPage from "../app/demo/page";

const PAGES: Record<string, string> = {
  "/": renderToStaticMarkup(createElement(Home)),
  "/demo": renderToStaticMarkup(createElement(DemoPage)),
};

function tagsOf(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "g"))].map((m) => m[0]);
}
function attr(el: string, name: string): string | null {
  const m = el.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}
/** The text a screen reader would announce: markup stripped, pictographs ignored. */
function accessibleName(el: string): string {
  const label = attr(el, "aria-label");
  if (label && label.trim()) return label.trim();
  const inner = el.replace(/^<[^>]*>/, "").replace(/<\/[a-z0-9]+>$/i, "");
  const withoutHidden = inner.replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, "");
  return withoutHidden
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/g, " ")
    .replace(/[\p{Extended_Pictographic}\p{So}←-⇿️]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

for (const [path, html] of Object.entries(PAGES)) {
  test(`${path} has exactly one h1`, () => {
    assert.equal(tagsOf(html, "h1").length, 1, html.slice(0, 200));
  });

  test(`${path}: every button has an accessible name`, () => {
    for (const b of tagsOf(html, "button")) {
      assert.ok(accessibleName(b).length > 0, `nameless button: ${b.slice(0, 160)}`);
    }
  });

  test(`${path}: every input and textarea is labelled`, () => {
    const fields = [...html.matchAll(/<(input|textarea)\b[^>]*>/g)].map((m) => m[0]);
    for (const f of fields) {
      const id = attr(f, "id");
      const labelled =
        (id && new RegExp(`<label\\b[^>]*\\sfor="${id}"`).test(html)) ||
        (attr(f, "aria-label") ?? "").trim().length > 0 ||
        attr(f, "aria-labelledby");
      assert.ok(labelled, `unlabelled field: ${f.slice(0, 160)}`);
    }
  });
}

test("/demo announces async state through a live region", () => {
  assert.match(PAGES["/demo"], /aria-live="polite"/);
});

test("the layout loads both analytics tags on every page", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /\/_vercel\/insights\/script\.js/);
  assert.match(layout, /POSTHOG_JS/);
  const snippet = readFileSync(new URL("../app/posthog.ts", import.meta.url), "utf8");
  assert.match(snippet, /posthog\.init\(\\"phc_/);
  assert.match(snippet, /S=\\"dementia-coach\\"/);
});
