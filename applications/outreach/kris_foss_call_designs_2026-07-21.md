# Design decisions from Kris Foss debrief — resolved 2026-07-21

Follow-up to [kris_foss_call_notes_2026-07-20.md](kris_foss_call_notes_2026-07-20.md). Reached via `/grill-me` — recorded here so the three action items have a concrete spec before implementation, not just a todo line.

---

## 1. Prototype/UX redesign — cross-role positioning

- **No rename.** Keep "CNA Shield" as the product name and brand. Mid-resubmission-cycle, docx filenames/cover sheets/email subject lines are already keyed to it — a rename adds file churn for no reviewer-facing upside. Kris's point was about positioning, not that the name itself was a liability.
- **New section, placed below the existing Marcus/CNA narrative** in `prototypes/cna-shield/app/page.tsx` — don't touch the narrative itself, it's the strongest asset on the page and shouldn't be delayed by a framing section up top.
- Content: role cards (CNA / DSP / DCW / CSP / etc.), each with one line on their equivalent pain point. **Sourced from BLS/institutional citations and Kris/Amy's domain authority — not a new scraped-data study.** CNA remains the one deep-evidence pilot role (6,333 posts, `_collect_all.py` → `_semantic_analysis.py` pipeline); don't manufacture a second evidence base under deadline pressure.
- Visual execution: run this through an actual `/beautify` live-Artifact session when building it — build 2-3 real variants, don't guess the layout/feel here.
- Application-side: once the section exists, `applications/track2_cna_shield/cna_shield_application.md` should reflect the same broadened positioning (likely touches Section 1 framing) — deferred until the prototype section is built so the application describes something real.

## 2. EMR-native-integration argument

- The application **already has this** as a technical argument — Section 5 ("Meritorious Prize Eligibility") covers FHIR-native architecture and a Phase 2 PointClickCare/Netsmart roadmap. Don't duplicate it.
- What's missing is Kris's specific point: EMR vendors as a **distribution/commercial channel** (they'd license or resell this rather than build it themselves), not just an integration target.
- **No new Phase 1 scope or timeline item.** Kris's comment was live brainstorming, not a scoped vendor conversation — claiming a concrete vendor-outreach activity would overstate readiness in Section 2.7, which is currently honest about lean, prioritized resourcing.
- Use it as **rationale** for the FHIR-native work Phase 1 already commits to. Lands in **Section 2.2** (Deployment Feasibility) — add to the adoption-incentives note.
- **Attribute it by name** to Kris/ICI ("a conversation with direct support workforce experts at UMN's ICI surfaced...") — doubles as a soft preview of the item-3 relationship.

## 3. Pilot-path narrative

- **Sequencing: hold the resubmission until Kris's actual letter of support is in hand.** Don't guess at pilot specifics (facility type/count) she hasn't given you yet — she already said she has concrete ideas she's folding into the letter; write to match it, not around it.
- **Safe to draft now** (true today, independent of the letter): Section 2.5 (Team Roles) — replace the generic, currently-unfilled "Workforce Partner" placeholder with Kris Foss / ICI's Direct Support Workforce Solutions team by name, describing the real, ongoing collaboration.
- **Wait for the letter**: Section 2.1's specific pilot plan ("50 CNAs across 2 SNF/long-term care facilities to be recruited") — reconcile this to whatever Kris's letter actually specifies once it arrives, then do one final resubmission pass with both the application and the letter together (same pattern as the Data Output Logs resubmission).

---

## Execution order (not yet started)

1. Draft Section 2.5 Team Roles update now (safe, no dependency).
2. Run `/beautify` on the prototype role-card section; port to `page.tsx` once a direction is chosen.
3. Add the EMR-vendor-channel rationale to Section 2.2, attributed to Kris/ICI.
4. Update Section 1 framing in the application once the prototype section exists.
5. Wait for Kris's letter of support; reconcile Section 2.1's pilot plan to it.
6. Final resubmission: updated `.docx` files + Kris's letter, before July 31 deadline.
