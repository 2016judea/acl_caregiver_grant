# CNA Shield — Data Output Logs

**Supplemental material — does not count toward the page limit.**

Prototype: https://cna-shield.vercel.app
Model: `claude-opus-4-8`
Generated: 2026-07-13 15:58 UTC

These logs are genuine, reproducible output from the working prototype. Each
entry below shows an exact input and the exact, unedited model output produced
by the deployed system prompt. Inputs are drawn from the caregiver-forum
evidence base described in the application — not invented for this document. Any
reviewer can reproduce equivalent output at the prototype URL above.

---

## What this demonstrates

Given the raw notes a CNA speaks aloud across a shift plus the staffing ratio, the tool returns a structured, triaged end-of-shift handoff — urgent items first, with the escalation reason stated, plus a timestamped ratio record. It invents nothing: every line traces to a spoken note. This is the voice-to-handoff capability the application rates at TRL 3.

---

## Log 1 — Short-staffed night shift (the Marcus scenario) — escalation + ratio breach

*Timestamp: 2026-07-13T15:58:11+00:00*

**Shift metadata:** 14 residents assigned; legal/target ratio 1:8.

**Raw spoken input:**

- “Room 306 repositioned to the right side, incontinence care done, resident calm”
- “Room 312 seems more confused than her baseline tonight, didn't know where she was”
- “Room 308 blood pressure one forty two over eighty eight, a little high, flagging it”
- “Room 301 Mr Davis blood pressure one fifty six over ninety four, that's his second high reading this shift”
- “Room 309 refused his evening meds, called the family per protocol”
- “Room 304 ate all of dinner, no issues, went to bed fine”

**Model output — structured handoff:**

**🔴 Urgent**
-  **301:** Mr Davis blood pressure 156/94, second high reading this shift — *Two elevated BP readings on same resident this shift — needs assessment first.*
-  **309:** Refused his evening meds, family called per protocol — *Refusal of medications — confirm which meds and follow up.*

**⚠ Watch**
-  **312:** More confused than her baseline tonight, didn't know where she was
-  **308:** Blood pressure 142/88, a little high, flagged

**✓ Routine**
-  **306:** Repositioned to right side, incontinence care done, resident calm
-  **304:** Ate all of dinner, no issues, went to bed fine

**Ratio record:** Shift was over the 1:8 ratio by 6 residents (14 assigned).

---

## Log 2 — Evening shift — a fall and a skin change surface among routine care

*Timestamp: 2026-07-13T15:58:16+00:00*

**Shift metadata:** 11 residents assigned; legal/target ratio 1:8.

**Raw spoken input:**

- “Room 210 found on the floor next to the bed, says she slid, no visible injury but I'm noting it”
- “Room 214 new red open area on the left heel, didn't have that yesterday”
- “Room 207 walked to dinner with the walker, steady, good appetite”
- “Room 212 complained her stomach hurt after dinner, no vomiting, keeping an eye on it”
- “Room 205 shower done, nails trimmed, resident happy”

**Model output — structured handoff:**

**🔴 Urgent**
-  **210:** Found on the floor next to the bed, says she slid. No visible injury but noted. — *Fall this shift — needs assessment for injury and fall-prevention follow-up first.*

**⚠ Watch**
-  **214:** New red open area on the left heel, was not there yesterday.
-  **212:** Stomach hurt after dinner, no vomiting. Keeping an eye on it.

**✓ Routine**
-  **207:** Walked to dinner with walker, steady, good appetite.
-  **205:** Shower done, nails trimmed, resident happy.

**Ratio record:** Over the 1:8 ratio by 3 residents this shift.

---

## Log 3 — Day shift — mostly routine, one watch item (baseline demonstration)

*Timestamp: 2026-07-13T15:58:21+00:00*

**Shift metadata:** 9 residents assigned; legal/target ratio 1:8.

**Raw spoken input:**

- “Room 118 up and dressed, ate breakfast, joined activities”
- “Room 121 a little more tired than usual, napped through the morning, eating okay”
- “Room 119 physical therapy came, walked the hall twice, no complaints”
- “Room 124 shower and grooming done, resident in good spirits”

**Model output — structured handoff:**


**⚠ Watch**
-  **121:** More tired than usual, napped through the morning. Eating okay.

**✓ Routine**
-  **118:** Up and dressed, ate breakfast, joined activities.
-  **119:** Physical therapy came, walked the hall twice, no complaints.
-  **124:** Shower and grooming done, in good spirits.

**Ratio record:** Over the 1:8 ratio by 1 resident this shift.

---
