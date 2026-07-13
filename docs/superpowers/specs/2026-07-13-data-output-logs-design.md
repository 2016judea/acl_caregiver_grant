# Data Output Logs + Narrative Tie-In — ACL Caregiver AI Challenge

**Date:** 2026-07-13
**Deadline:** Phase 1 resubmission due Fri July 31, 2026, 5:00 p.m. ET
**Tracks:** Track 1 (Dementia Coach), Track 2 (CNA Shield)

## Why

ACL's 2026-07-09 update lets applicants attach **Data Output Logs** as supplemental
material that does **not** count toward the page limit. The same email stresses the
**TRL 3+** eligibility bar. Real, reproducible tool outputs are the strongest possible
TRL evidence — they prove the tool works today rather than on a slide.

ACL also confirmed applications may be **resubmitted any time before the deadline**,
each in its own email, 508-compliant, using the exact section headings.

## The asymmetry driving the design

- **Dementia Coach** already has a real AI backend (`app/api/coach/route.ts` → Claude).
  Its outputs are genuine and reproducible.
- **CNA Shield** is a simulated mockup — no API route, no AI — yet the narrative sells it
  as an "AI application" that "generates structured shift handoffs." Hand-writing a
  "data output log" for it would be fabricated TRL evidence (a reviewer red flag, and a
  violation of our own no-fabrication standard).

**Decisions (approved 2026-07-13):**
1. Build a real backend for CNA Shield so its logs are genuine.
2. Moderate narrative rewrite — point specific claims at specific logs, tighten any
   claim the logs don't support.

## Scope

### Part 1 — CNA Shield real backend
- Add `prototypes/cna-shield/app/api/handoff/route.ts`, mirroring the Dementia Coach route.
- **Input:** raw care notes spoken across a shift (array of utterances) + shift metadata
  (resident count, assigned ratio, legal ratio).
- **Output:** structured, triaged handoff — `URGENT` / `WATCH` / `ROUTINE` buckets,
  clinically prioritized (repeated elevated BP escalated, confusion-above-baseline
  flagged), plus a timestamped ratio-violation record.
- **Prompt discipline:** conservative — never invent a vital or a fact not in the input;
  surface what the next nurse must know first; plain language.
- Wire the demo's "Generate Full Handoff" button to the route so the live prototype
  genuinely runs AI (upgrades Track 2 mockup → truthful TRL-3 demo).
- Add `@anthropic-ai/sdk` dependency + `ANTHROPIC_API_KEY` env var (Vercel).

### Part 2 — Data Output Log generation
- One reproducible generation script (in the grant repo) that runs each **real** API
  across curated inputs and captures `input → timestamp → exact model output` with a
  one-line "what this demonstrates" annotation per entry.
- Inputs drawn from the actual forum-derived evidence base, not invented.
- **Dementia Coach:** ~8 scenarios (pick-up-the-kids, "where is Robert"/grief, bath
  refusal, "I want to go home," sundowning agitation, identity/usefulness, etc.).
- **CNA Shield:** 3 full shift runs (raw voice stream → triaged handoff) that exercise
  the escalation + ratio-logging logic.
- Header on each log documents the model, the live prototype URL, and reproducibility.

### Part 3 — Moderate narrative edits
- Tighten each narrative's TRL / "Evidence of readiness" section so claims cite specific
  logs; add a "Supplemental Materials: Data Output Logs" pointer; add a cover-sheet line.
- CNA Shield readiness claim upgrades from "adaptation of proven physician tech" →
  "demonstrated today (see Data Output Logs)."
- No full restructure of Sections 1–2.

### Part 4 — Packaging for resubmission
- Format: **508-compliant `.docx`** matching the existing submissions, via
  `build_508_docx.py` — one `<Tool>_Data_Output_Logs.docx` per track + regenerated
  narrative `.docx`.
- Draft two ready-to-send resubmission emails (one per track) for Aidan to review + send.

## Recommendations / defaults
- Model → current Opus (`claude-opus-4-8`); Dementia Coach is pinned to older
  `claude-opus-4-7`. Confirm the exact current model id via the `claude-api` skill
  before changing.
- CNA Shield redeploy to Vercel will likely need Aidan's auth — build + test locally,
  flag when ready to push.

## Out of scope
- No full narrative restructure.
- Claude does not send the grant emails — Aidan sends.
- No new prototype features beyond the handoff API + button wiring.

## Done when
- CNA Shield `/api/handoff` returns a valid triaged handoff from raw notes (verified by
  a real run), and the demo button calls it.
- Two `*_Data_Output_Logs.docx` exist, 508-compliant, containing genuine captured outputs.
- Both narratives cite their logs; regenerated `.docx` render correctly.
- Two resubmission email drafts ready for Aidan.
