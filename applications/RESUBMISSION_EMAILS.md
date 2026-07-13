# Phase 1 resubmission — ready-to-send emails

ACL confirmed (2026-07-09) that applications may be **resubmitted any time before
the deadline (Fri July 31, 5:00 p.m. ET)**, each in its own email to
**CaregiverAI@acl.hhs.gov**. These are updated Phase 1 submissions that add the new
**Data Output Logs** supplemental material and tighten the readiness narrative to
cite it.

**Send two separate emails. Do not combine them.** Aidan sends — Claude does not.

---

## Email 1 — Track 1 (Dementia Coach)

**To:** CaregiverAI@acl.hhs.gov
**Subject:** Updated Phase 1 Submission — Track 1 — Dementia Coach — Aidan Jude

Attach (from `applications/track1_dementia_coach/`):
- `Dementia_Coach_ACL_Submission.docx`
- `Dementia_Coach_Evidence_Appendix.docx`
- `Dementia_Coach_Data_Output_Logs.docx`  ← new supplemental material

**Body:**

To whom it may concern,

Please find attached an updated Phase 1 submission for Track 1 of the Caregiver AI
Challenge — Dementia Coach. This version supersedes my earlier Track 1 submission.

In addition to the narrative and evidence appendix, I've included a **Data Output
Logs** document as supplemental material. It captures eight genuine, reproducible
runs of the working prototype across the caregiving scenarios described in the
application — showing the tool producing personalized, validation-therapy coaching
today. The prototype remains live at https://dementia-coach.vercel.app.

Thank you,
Aidan Jude

---

## Email 2 — Track 2 (CNA Shield)

**To:** CaregiverAI@acl.hhs.gov
**Subject:** Updated Phase 1 Submission — Track 2 — CNA Shield — Aidan Jude

Attach (from `applications/track2_cna_shield/`):
- `CNA_Shield_ACL_Submission.docx`
- `CNA_Shield_Evidence_Appendix.docx`
- `CNA_Shield_Data_Output_Logs.docx`  ← new supplemental material

**Body:**

To whom it may concern,

Please find attached an updated Phase 1 submission for Track 2 of the Caregiver AI
Challenge — CNA Shield. This version supersedes my earlier Track 2 submission.

In addition to the narrative and evidence appendix, I've included a **Data Output
Logs** document as supplemental material. It captures three full shifts run through
the working prototype, showing it turn raw spoken care notes into a structured,
triaged shift handoff — escalating urgent items, flagging changes from baseline, and
inventing nothing. The prototype is live at https://cna-shield.vercel.app.

Thank you,
Aidan Jude

---

## Before sending — checklist

- [ ] **Redeploy CNA Shield to Vercel** so the live URL runs the new AI handoff
      (needs your Vercel auth + the `ANTHROPIC_API_KEY` env var set on the project).
      Until then the demo's "Generate Full Handoff" button will show the
      "couldn't reach the handoff service" note. The Data Output Logs themselves are
      already genuine and don't depend on the redeploy.
- [ ] Open each `.docx` once to confirm it renders (headings, the log entries).
- [ ] Send the two emails separately.
