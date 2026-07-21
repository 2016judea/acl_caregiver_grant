# CNA Shield
## *Document care with your voice. Protect yourself with your record.*

**Working Prototype:** https://cna-shield.vercel.app

**ACL Caregiver AI Challenge — Track 2, Phase 1 Submission**
**Meritorious Focus Area: EMR Interoperability**

---

## Abstract

CNA Shield is a voice-first mobile AI application that gives Certified Nursing Assistants and direct care workers hands-free tools to document care delivery, generate structured shift handoffs, and report staffing violations — without stopping their work to type. By meeting CNAs where they actually work (on their feet, in residents' rooms, with no free hands), CNA Shield reduces documentation burden, closes dangerous shift-to-shift communication gaps, and creates the timestamped objective record that protects workers when systems fail them. Analysis of 6,333 posts across six caregiver communities identified documentation burden, unsafe staffing ratios, shift handoff failures, and worker protection gaps as the dominant workforce pain points — present in 338 posts about ratio violations, 319 posts about workforce attrition, and 92 posts describing charting as a distinct, compounding burden. The technology foundation is mature: AI ambient clinical documentation is proven at TRL 7-8 for physicians. CNA Shield's novel contribution is adapting this architecture for the direct care worker — a population systematically excluded from healthcare technology investment — with a voice-first interaction design, anonymous ratio reporting infrastructure, and worker-protective data governance. A functional prototype is available at: **https://cna-shield.vercel.app**

*(248 words)*

---

---

## The Shift This Is Built For

It is 11:40 p.m. Marcus has 14 residents tonight — the ratio is supposed to be 8:1. Two CNAs called out. Nobody came in to cover.

He has been on his feet for seven hours without a break. He just repositioned Mrs. Chen, took Mr. Davis's vitals, changed a brief in 306. He did not stop moving once.

Now it is end of shift. The night CNA is here. Marcus has four minutes before the bus.

He goes to the charting kiosk mounted on the wall near the nursing station — the one for CNAs, because CNAs don't use the nurses' computers. He stands there in the hallway, feet aching, and begins to type from memory: who he checked on, what he found, what he did, in what order, at what approximate time.

He gets through six residents in three minutes and logs the rest as "routine care." He tells the incoming CNA what he can in ninety seconds. There is no note on Mr. Davis's elevated BP. There is no note on the resident in 312 who seemed more confused than usual. The bus will not wait.

The next shift starts cold.

---

**What Marcus's shift looks like with CNA Shield:**

At shift start, he taps once: *14 residents assigned.* The ratio is logged, timestamped, verified.

Throughout the shift, he speaks while he works: *"Room 306, repositioned to right side, incontinence care complete, resident calm."* Thirty seconds. Hands never stopped.

At shift end, the app presents a complete draft care log — every room, every event, timestamped — ready for his review. He corrects two entries, approves it. Total time: four minutes.

The shift handoff summary is already generated: Mr. Davis's BP flagged, the 312 resident's baseline change noted, two items marked for immediate follow-up. The incoming CNA reads it before entering the floor.

Nothing is lost. Nobody starts cold.

And at the end of the month, 23 documented shifts show a 1:14 ratio. The aggregate, anonymized report goes to the state. No individual worker's name is attached.

---

This is what every CNA shift should look like. It is what the technology already allows. CNA Shield builds the bridge.

---

## Section 1: Understanding of Need and Solution Design

### 1.1 The Specific Workforce Challenges CNA Shield Addresses

The direct care workforce faces a structural accountability gap: the workers with the least institutional power carry the most personal liability for conditions they did not create. This gap has three concrete expressions that CNA Shield directly targets.

**Challenge 1: Documentation burden during hands-on care**

CNAs cannot chart while providing care. This is a physical impossibility — care requires both hands, full attention, and continuous movement. The result is after-the-fact documentation that is delayed, incomplete, and legally vulnerable. Facilities exploit this gap: when care cannot be proven, it becomes the worker's problem.

Our community analysis of r/CNA — 1,324 posts from working CNAs — identified 92 posts in which charting burden appeared as a distinct, compounding stressor on top of an already unsustainable workload. One post described CNA charting infrastructure directly:

> *"In orientation they said 'we have computers in the nursing station for charting but we encourage you NOT to use them. There are kiosks mounted on the wall specifically for the CNAs.' The kiosks make your arm hurt and your feet are already killing you. I'm fed up with the way we're treated."*

This is not a productivity problem. It is a dignity and protection problem. The documentation system is designed for nurses. CNAs are given wall kiosks.

**Challenge 2: Shift handoff communication failures**

Structured handoff information — patient baselines, behavioral changes, care exceptions, new orders — is not consistently transmitted between CNAs. Nurses have SBAR (Situation-Background-Assessment-Recommendation), a standardized handoff protocol taught in every nursing program. CNAs have nothing equivalent.

Our analysis surfaced a case that illustrates the patient safety consequence:

> *"The charge nurse had to ask me if the patient was forming normal sentences when I last saw them. The nurse prior didn't give a baseline. There was no way of knowing how long the patient had been in that state."*

The CNA had potentially missed a stroke because the prior shift left no neurological baseline in the handoff. The patient outcome was unknown. The CNA carried the guilt for a system-level failure.

**Challenge 3: No protected mechanism for reporting ratio violations**

Legal staffing ratios (1:8 in many states) are routinely violated. Our analysis found 338 posts describing staffing ratio conditions, with specific violations documented in raw terms by CNAs living them:

> *"Legislation says the ratio is supposed to be 1:8 during the day but most of the time this month it's been 1:21 per hall with a float."*
> — CNA who attempted to report their facility to state regulators

> *"Ratio went up to 10:1. Third night, 14:1. I was running around non-stop. She's written me up for neglecting and ignoring a patient's needs."*
> — CNA disciplined for care lapses caused by facility-imposed impossible ratios

CNAs who report unsafe conditions risk termination. The CNA who submitted a state report described needing to include her name in the submission email — making the "anonymous" report traceable. Without objective, timestamped, aggregated evidence, ratio violation reports are dismissed as disgruntled worker complaints.

**Beyond CNAs: a shared direct-care pattern.** CNA Shield's evidence base above is CNA-specific — 6,333 posts drawn from CNA and adjacent caregiver communities — and CNA is Phase 1's pilot role. But the underlying failure mode is not unique to CNAs. In discussion with the Direct Support Workforce Solutions team at the University of Minnesota's Institute on Community Integration (ICI), which works across the intellectual/developmental disability and home health direct care workforce, the same pattern recurred: Direct Support Professionals (DSPs), Home Health Aides, and Community Support Professionals (CSPs) perform structurally identical hands-on, documentation-heavy shift work, often with even less formal training than CNAs receive. The Bureau of Labor Statistics groups these roles under related direct-care occupational categories, and ACL itself has been pursuing cross-sector workforce tooling standardization. CNA Shield's voice-first mechanic — speak while working, structured entry, auto-generated handoff — is role-agnostic by design; Phase 1 pilots it with CNAs specifically because that is where the deepest evidence base and TRL readiness already exist, not because the mechanism is CNA-specific. The working prototype demonstrates this directly.

### 1.2 The AI Solution

CNA Shield is a HIPAA-compliant mobile application (iOS and Android) with three integrated modules.

**Module 1 — Voice Care Logging**

CNAs activate the app at shift start. Throughout the shift, they speak brief care observations hands-free: *"Just completed incontinence care for Room 12, repositioned to left side, vitals BP 128/82, resident alert and oriented to person and place."* On-device speech recognition captures the audio; a cloud LLM structures it into a timestamped care entry mapped to facility-standard documentation formats. At shift end, the app presents a complete, editable care log for CNA review and approval before submission.

Nothing is auto-submitted. The CNA reviews and approves every entry. Human judgment governs the record.

**Module 2 — Shift Handoff Assistant**

At shift end, the AI synthesizes the day's voice logs into a structured handoff summary: patients who had falls or near-falls, behavioral changes from their documented baseline, medication exceptions, and care items requiring immediate attention from the oncoming shift. The outgoing CNA reviews, approves, and transmits. The incoming CNA receives the summary at shift start. This creates a continuous, auditable baseline record — directly addressing the stroke-miss scenario identified in our evidence base.

**Module 3 — Safe Ratio Reporting**

CNAs log their actual patient assignment at shift start with a single tap (e.g., "14 residents assigned"). The app accumulates ratio data across shifts and workers and generates aggregate, anonymized reports for state regulatory submission — with timestamped documentation supporting the report. No individual worker is identified. This function is worker-owned and worker-initiated — generated only when a CNA logs an assignment, never accessible to or controlled by the facility, and independent of whether the facility adopts CNA Shield. The system uses differential privacy techniques to ensure that even aggregate data cannot be reverse-engineered to individual reporters. This is analogous to the Aviation Safety Reporting System (ASRS), which transformed airline safety by decriminalizing incident reporting.

### 1.3 Current Development Stage (TRL)

| Component | Technology Basis | TRL |
|-----------|-----------------|-----|
| On-device speech recognition | Whisper (OpenAI) | 8 |
| Clinical AI documentation | Ambient scribing (Nuance DAX, Suki, Abridge) | 7 (physicians) |
| CNA-adapted language model | Fine-tuning on direct care workflow data | 3–4 |
| FHIR-compliant care record output | HL7 FHIR R4 | 6 |
| Anonymous ratio reporting pipeline | Differential privacy + aggregation | 3–4 |
| HIPAA-compliant mobile infrastructure | Standard healthcare app stack | 7 |

**Overall application TRL: 3–4.** AI ambient documentation for physicians is proven at TRL 7–8. CNA Shield's novel contributions — voice interaction designed for care settings, CNA-specific terminology modeling, anonymous worker-protective reporting — are the Phase 1 development targets, establishing TRL 4 by submission for Phase 2.

**Evidence of readiness.** The functional prototype (linked above) turns raw spoken shift notes into a structured, triaged handoff today — and this is documented, not merely described. The accompanying **Data Output Logs** (supplemental material) capture three full shifts run through the prototype. They show the capability that matters: the tool triages by clinical urgency and invents nothing. In Log 1, a single elevated blood-pressure reading is placed on "watch," while the *same resident's second* elevated reading is escalated to "urgent" with the reason stated — the difference a tired worker at a 1:14 ratio can miss. In Log 2, a fall is surfaced to the top of the handoff; in Log 3, a routine shift correctly produces no urgent items. Every line in every handoff traces back to a spoken note; no vital sign or event is fabricated. This substantiates the voice-to-handoff core at TRL 3. The components still rated TRL 3–4 — the CNA-adapted speech model tuned to care-setting terminology and the anonymous ratio-reporting pipeline — are honestly at the design/early-prototype stage and are explicit Phase 1 development targets, not current capabilities; the higher-rated components (on-device speech recognition, FHIR output, HIPAA infrastructure) reuse mature, widely deployed technology. The accompanying Evidence Appendix documents the underlying research and methodology. Throughout, we distinguish what is demonstrable now from what Phase 1 will build, per the Challenge's technology-readiness guidance.

### 1.4 Evidence Base and User Input

Our evidence base draws on computational analysis of 6,333 organic posts from six caregiver communities: r/CNA, r/eldercare, r/caregivers, r/caregiving, r/AgingParents, and r/dementia. These posts were written without researcher presence or prompting — authentic, unsolicited expressions of lived experience. Full methodology — data collection, quality filtering, semantic similarity mapping, and structured extraction — is detailed in the accompanying Evidence Appendix submitted with this application.

Prior user input informing the design:
- Pain point extraction from 30 high-signal CNA posts produced 21 structured pain points at average severity 4.2/5.0
- Keyword analysis confirmed: 338 ratio-related posts, 319 attrition posts, 92 charting posts, 42 short-staffing posts
- Semantic similarity analysis (sentence-transformer embeddings across 6,236 text chunks) confirmed low pay (0.506 similarity), retention/quitting (0.410), and short-staffing (0.398) as the highest-signal T2 themes

Phase 1 will extend this foundation with structured participatory design sessions with practicing CNAs (see Section 2).

---

## Section 2: Implementation Approach

### 2.1 Testing and Evaluation Methodology

Phase 1 evaluation uses a pre-post design across two partner facilities:

- **Participants:** 50 CNAs across 2 SNF/long-term care facilities to be recruited during Phase 1 foundation months (target: diverse geography, facility size, payer mix)
- **Duration:** 8-week active use period per cohort
- **Control condition:** Standard facility documentation practices at baseline

**Primary outcome measures:**
1. Documentation completeness — % of shift care events with a timestamped voice log (target: ≥40% improvement vs. baseline paper/kiosk charting)
2. Handoff quality — % of shift handoffs with structured baseline data present for receiving CNA (target: ≥80%)
3. Time-to-chart — Minutes spent on end-of-shift documentation (target: ≥30% reduction)
4. Ratio reporting rate — Number of ratio violations documented and submitted per facility
5. CNA retention intent — Intent to Leave scale (validated; Anticipated Turnover Scale) at 0 and 8 weeks

**Secondary measures:**
- System Usability Scale (SUS) score (target: ≥75, "Good")
- Voice recognition accuracy rate (target: ≥92% word accuracy on care terminology)
- CNA-reported confidence that their care delivery is documented (self-report scale)

### 2.2 Deployment Feasibility and Key Success Factors

**Success factors and mitigation strategies:**

| Risk | Mitigation |
|------|-----------|
| Facility WiFi gaps during voice logging | On-device processing; sync-on-connect architecture |
| CNA skepticism about employer data access | Worker-controlled data governance; facility cannot access individual CNA logs without consent |
| Voice accuracy for accents/fast speech | Multi-accent training data; easy correction UI; human review before submission |
| Regulatory complexity across states | Legal review of ratio reporting pipeline per state; modular compliance architecture |
| EHR integration timelines | Standalone operation in Phase 1; FHIR integration in Phase 2 |
| Facility hesitance toward a tool that surfaces ratio violations | Worker-first model (see below): the app is free to workers and independent of facility adoption; facilities license documentation and handoff value, not the ratio function; facilities that staff to legal ratios have nothing to surface |

**A note on adoption incentives.** CNA Shield is worker-first: the app is free to individual CNAs permanently and works whether or not their facility participates. Facility licensing pays for the enterprise documentation and handoff infrastructure — complete, timestamped care records that reduce a facility's own liability and survey-deficiency risk and support CNA retention. That is the facility value proposition, and it is independent of Module 3. The ratio-reporting function is worker-owned, worker-initiated, and anonymized; facilities neither control nor pay for it, and facilities that staff to legal ratios have nothing to surface. This mirrors how confidential safety-reporting systems such as the FAA's Aviation Safety Reporting System coexist with — and are trusted precisely because they remain independent of — the organizations they help improve.

**A note on the FHIR-native investment.** Phase 1's decision to structure all data in FHIR R4 format from the outset (Section 1.3) is not only a technical interoperability requirement — it is a distribution strategy. In discussion with the direct support workforce team at UMN's Institute on Community Integration, whose work spans the EMR landscape used across intellectual/developmental disability and home health provider organizations (including systems like THERAP), a recurring pattern emerged: post-ACA consolidation has pushed provider organizations toward standardized EMR platforms, and those platforms have strong incentive to natively integrate — and resell — tools like CNA Shield rather than build equivalent voice documentation themselves. A FHIR-native architecture positions CNA Shield as a plug-in an EMR vendor can adopt and distribute to its existing customer base, not merely a standalone app seeking facility-by-facility adoption.

### 2.3 User-Centered Design Integration

**Phase 1 co-design stages:**

*Months 1–3: Participatory design*
Structured workshops with 20 CNAs across 3 facility types (SNF, memory care, home care). Paper prototypes and voice interaction mockups tested with working CNAs. Specific design questions: What triggers a voice log (manual tap vs. room entry detection)? What care events require logging vs. are optional? What does "review and approve" look like for a CNA with 30 seconds between rooms?

*Months 4–7: Alpha deployment*
30 CNA alpha users. Bi-weekly 30-minute feedback sessions. Focus: voice interaction friction, documentation accuracy, handoff usability. Rapid iteration cadence (2-week sprints).

*Months 8–12: Beta and validation*
50 CNA beta users across 2 facilities. Outcome metric collection. Exit interviews with users who disengage to identify barriers.

**Design principles derived from community evidence:**

- **Hands-free first.** Every interaction is designed for one hand, gloves on, in a resident's room. No scrolling, no typing during care.
- **Worker-protective data governance.** CNAs own their logs. Facilities see aggregate reports, not individual worker surveillance data. This distinction is communicated explicitly during onboarding.
- **Trust through transparency.** The anonymous reporting pipeline explains exactly how anonymization works — not just "it's anonymous," but the technical mechanism. Based on our finding that a CNA submitted a state report and found her name embedded in the email, trust cannot be assumed.

### 2.4 Project Timeline

| Phase | Months | Key Milestones |
|-------|--------|---------------|
| Foundation | 1–3 | IRB approval; facility partner outreach and LOI agreements; CNA advisory panel recruited; voice model training initiated; HIPAA compliance review complete |
| Alpha | 4–6 | Working prototype with Module 1 (voice logging); 30 alpha CNA users; usability testing; clinical terminology accuracy benchmarked |
| Beta | 7–9 | All three modules integrated; 50 beta users across 2 facilities; EHR integration scoped with partner vendor |
| Validation | 10–12 | Outcome metric analysis; refinement based on user data; Phase 2 design document; FHIR integration pilot |

### 2.5 Team Roles

| Role | Responsibilities |
|------|----------------|
| Principal Investigator | Overall direction, partner relationships, regulatory navigation, IRB |
| Lead Engineer | Voice pipeline, LLM fine-tuning, HIPAA-compliant infrastructure, FHIR integration |
| Clinical Advisor | CNA terminology accuracy, care documentation standards, facility protocol alignment |
| UX / User Research | Participatory design facilitation, usability testing, interaction design |
| Workforce Partner | Direct Support Workforce Solutions team, University of Minnesota Institute on Community Integration (ICI) — CNA/DSP recruitment and trust-building, worker-protective governance design informed by ICI's cross-sector direct care workforce expertise |

CNA Shield is in active collaboration with ICI, the University of Minnesota's designated University Center for Excellence in Developmental Disabilities, engaged through ICI Director Amy Hewitt and ICI's Direct Support Workforce Solutions team. ICI reviewed the working prototype and is preparing a letter of support (forthcoming) reflecting this collaboration.

*Additional team members will be recruited and onboarded during Phase 1 foundation months (clinical advisor, UX researcher). Biographical sketches will be updated upon recruitment.*

### 2.6 Safety and Bias Mitigation Monitoring

- **Bias monitoring:** Voice recognition accuracy tracked separately by accent, regional speech pattern, and language background. If accuracy drops below 88% for any subgroup, retraining is triggered before continued deployment.
- **Algorithmic auditing:** LLM structuring outputs reviewed monthly by clinical advisor for accuracy, omissions, and hallucinations. Any systematic error pattern triggers immediate model review.
- **Safety monitoring:** If ratio reporting data reveals conditions that appear to pose immediate patient safety risk, the system has a defined escalation pathway to state health departments (with worker consent).
- **Continuous improvement:** Bi-weekly user feedback sessions throughout Phase 1; model updated on a 4-week cycle based on correction patterns.

### 2.7 Phase 1 Resourcing and Feasibility

Phase 1 is deliberately scoped for lean execution. The core build team is the Principal Investigator plus a contract engineer; domain expertise comes through a compensated CNA advisory panel, a clinical/documentation advisor, and partner facilities rather than full-time hires. Award funds are prioritized, in order: (1) the voice-recognition and LLM-structuring pipeline and its accuracy benchmarking; (2) HIPAA-compliant infrastructure and per-state legal review of the ratio-reporting pipeline; (3) CNA recruitment and compensation for co-design and the outcome cohorts; (4) facility partnership and integration scoping. Because a working prototype already exists, Phase 1 funds validation, compliance, and workforce trust — not first-build risk. The advisor-and-partner model keeps fixed costs low while grounding the work in real facility and worker input.

---

## Section 3: Usability and Integration

### 3.1 Error Prevention and Human Judgment

Every AI output requires CNA review and explicit approval before entering any record. The app presents structured entries as editable drafts — not final submissions. One-tap correction for any AI inference. Nothing about a resident's care is documented without the CNA's active confirmation.

The AI is a scribe. The CNA is the clinician.

### 3.2 System Transparency

When the LLM maps a voice note to a structured care category, it shows its reasoning: *"I interpreted 'repositioned' as 'turning/repositioning for pressure injury prevention' — is that right?"* The CNA confirms or selects an alternative. No black-box outputs in clinical documentation.

The ratio reporting pipeline explains its anonymization method in plain language during setup. Workers understand exactly what data is collected, what is shared, and what cannot be traced back to them.

### 3.3 Usability Testing Approach

- System Usability Scale (SUS) administered at alpha (month 6) and beta (month 9)
- Task completion testing: Can a CNA log a care event, end a shift, and generate a handoff in under 90 seconds?
- Accessibility: Screen reader compatibility; large-tap targets; voice-only operation mode for CNAs who cannot look at a screen during care

### 3.4 Integration Into Target Environments

Phase 1 operates as a standalone mobile application — no EHR integration required for initial deployment. This is intentional: facility EHR procurement cycles are 12–24 months; requiring integration would block Phase 1 adoption.

Phase 2 target: FHIR R4 integration with PointClickCare (dominant in SNF market) and Netsmart, enabling Module 1 outputs to flow directly into the facility EHR.

**EMR Interoperability (Meritorious Focus Area):** The FHIR integration roadmap positions CNA Shield for the Track 2 EMR interoperability meritorious prize in Phase 2. Phase 1 designs all data structures in FHIR-native format to enable this transition without architectural rework.

### 3.5 Offline Capability

Nursing facilities have unreliable WiFi. Voice logs record locally with on-device processing. Sync occurs when connectivity is restored. No care event is lost to connectivity gaps. This is a hard requirement informed by facility site visits and CNA feedback.

---

## Section 4: Alignment with Caregiver AI Principles

| Principle | CNA Shield Implementation |
|-----------|--------------------------|
| **Privacy protection** | HIPAA-compliant infrastructure; resident data governed by facility data agreements; CNA personal logs owned by the worker, not the employer; differential privacy in aggregate reporting |
| **Human-in-the-loop accountability** | Every AI output reviewed and approved by CNA before record entry; no autonomous documentation; ratio reports require worker initiation |
| **Reduced caregiver burden** | Core design purpose: eliminate after-shift documentation backlog; voice-first removes typing barrier for workers who cannot stop moving |
| **Human connection priority** | Documentation handled by AI so CNAs spend less time at kiosks and more time with residents — the inverse of current practice |
| **Personalization** | Voice model adapts to individual CNA speech patterns over time; documentation templates configurable per facility care standards |
| **Safety, reliability, and transparency** | Explainable AI structuring decisions; audit trails for all documentation; bias monitoring by demographic subgroup; clinical advisor review of model outputs |
| **Affordability** | Free to individual CNAs permanently and independent of facility adoption; facility licensing (target: <$5/CNA/month) pays for the enterprise documentation, handoff, and EHR-integration infrastructure — not for the worker-owned ratio-reporting function; no CNA loses access if their facility does not participate |

---

## Section 5: Meritorious Prize Eligibility

CNA Shield addresses the **EMR Interoperability** Track 2 meritorious focus area as a central design element.

The documentation burden CNAs experience is inseparable from EMR infrastructure designed for nurses and physicians. CNAs are forced to use wall kiosks, paper logs, and after-the-fact entry because the EMR is not accessible to them in the physical context of care delivery.

CNA Shield's FHIR-native data architecture is designed from the ground up for EHR integration — not as a Phase 2 add-on but as a core architectural decision. All voice-logged care entries are structured in FHIR R4 format during Module 1 processing, making the integration path straightforward once facility EHR partnerships are established.

Phase 1 builds this FHIR-native foundation and scopes a pilot integration with one partner EHR vendor; full bidirectional integration is a Phase 2 deliverable. The target design is bidirectional: CNA Shield pulls existing care plans and resident baselines from the EHR (informing handoff context), and pushes CNA-logged care entries back into the structured record — making CNA observations a first-class part of the clinical record for the first time.

The interoperability design also addresses the assistive device landscape: Module 3's ratio reporting API is designed to accept data from facility scheduling systems and badge-based room entry systems, enabling passive ratio documentation without CNA input in future phases.

---

*Evidence Appendix: See accompanying document "Evidence Appendix: Data Methodology and Findings" submitted with this application.*

*Supplemental Materials: See accompanying document "Data Output Logs" — genuine, reproducible output from the working prototype across three full shifts (does not count toward the page limit).*

*Prototype: https://cna-shield.vercel.app*
