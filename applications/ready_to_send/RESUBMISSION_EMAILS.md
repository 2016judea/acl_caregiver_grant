# Phase 1 resubmission — ready-to-send emails

ACL confirmed (2026-07-09) that applications may be **resubmitted any time before
the deadline (Fri July 31, 5:00 p.m. ET)**, each in its own email to
**CaregiverAI@acl.hhs.gov** — their own guidance says nothing about zip files or
attachment format, just "submit each complete application in its own email." These
are updated Phase 1 submissions that add **Data Output Logs** and a new **TRL
Validation Log** supplemental material and tighten the readiness narrative to cite
them.

**Everything needed to send both emails is in this one folder**
(`applications/ready_to_send/`) — no need to go hunting in the track subfolders.

**Send two separate emails. Do not combine them.** Aidan sends — Claude does not.

---

## Email 1 — Track 1 (Dementia Coach)

**To:** CaregiverAI@acl.hhs.gov
**Subject:** Updated Phase 1 Submission — Track 1 — Dementia Coach — Aidan Jude

Attach (all in this folder):
- `Dementia_Coach_ACL_Submission.docx`
- `Dementia_Coach_Evidence_Appendix.docx`
- `Dementia_Coach_Data_Output_Logs.docx`  ← supplemental material
- `Dementia_Coach_TRL_Validation.docx`  ← new supplemental material (TRL 3+ evidence per ACL's Technology Readiness Guide)

**Body:**

To whom it may concern,

Please find attached an updated Phase 1 submission for Track 1 of the Caregiver AI
Challenge — Dementia Coach. This version supersedes my earlier Track 1 submission.

In addition to the narrative and evidence appendix, I've included a **Data Output
Logs** document as supplemental material. It captures eight genuine, reproducible
runs of the working prototype across the caregiving scenarios described in the
application — showing the tool producing personalized, validation-therapy coaching
today. I've also included a **TRL Validation Log**, documenting technique-correctness
and hallucination-check metrics against a 30-scenario labeled test set, a 40-case
adversarial "Smart 40" validation log, and a fake-directive safety test, per ACL's
Technology Readiness Guide — all run live against the deployed prototype. The
prototype remains live at https://dementia-coach.vercel.app/

Thank you,
Aidan Jude

---

## Email 2 — Track 2 (CNA Shield)

**To:** CaregiverAI@acl.hhs.gov
**Subject:** Updated Phase 1 Submission — Track 2 — CNA Shield — Aidan Jude

Attach (all in this folder):
- `CNA_Shield_ACL_Submission.docx`
- `CNA_Shield_Evidence_Appendix.docx`
- `CNA_Shield_Data_Output_Logs.docx`  ← supplemental material
- `CNA_Shield_TRL_Validation.docx`  ← new supplemental material (TRL 3+ evidence per ACL's Technology Readiness Guide)
- `CNA_Shield_Letter_of_Support_Foss.pdf`  ← **was never actually sent to ACL** — the application narrative (§2.5 and elsewhere) says "see accompanying appendix materials" for this letter, but it wasn't on the original attachment list. Include it now.

**Body:**

To whom it may concern,

Please find attached an updated Phase 1 submission for Track 2 of the Caregiver AI
Challenge — CNA Shield. This version supersedes my earlier Track 2 submission.

In addition to the narrative and evidence appendix, I've included a **Data Output
Logs** document as supplemental material. It captures three full shifts run through
the working prototype, showing it turn raw spoken care notes into a structured,
triaged shift handoff — escalating urgent items, flagging changes from baseline, and
inventing nothing. I've also included a **TRL Validation Log**, documenting
precision/recall/F1 metrics against a 50-case labeled test set, a 40-case adversarial
"Smart 40" validation log, and a fake-protocol safety test, per ACL's Technology
Readiness Guide — all run live against the deployed prototype. Finally, I've included
a letter of support from the Institute on Community Integration (ICI) at the
University of Minnesota's Direct Support Workforce Solutions team, referenced in
Section 2.5 of the application. The prototype is live at https://cna-shield.vercel.app/

Thank you,
Aidan Jude

---

## Before sending — checklist

- [x] Both prototype endpoints confirmed live and working — extensively tested live
      (150+ real calls) while building the TRL Validation Logs on 2026-07-23.
- [ ] Open each `.docx` once to confirm it renders (headings, the log entries).
- [ ] Skim `CNA_Shield_TRL_Validation.docx` and `Dementia_Coach_TRL_Validation.docx`
      for the two flagged items called out in this session: a hallucination finding
      in Dementia Coach's DSAFE-2 case, and an intermittent-500 finding in its
      Smart 40 section. Both are documented honestly, not hidden — just worth your
      eyes before this goes out.
- [ ] Send the two emails separately.
