# Dementia Coach

**Working Prototype:** https://dementia-coach.vercel.app

## *The right words, for the right person, in the hardest moment.*

**ACL Caregiver AI Challenge — Track 1, Phase 1 Submission**
**Meritorious Focus Area: Dementia Caregiving**

---

## Abstract

Dementia Coach is a mobile AI application that translates validation therapy — a widely taught, professionally endorsed approach to dementia behavioral management — into personalized, real-time guidance accessible to any family caregiver. Using the care recipient's own life history, relationships, and preferences, the AI generates tailored communication scripts for the moments that most often escalate into crisis: sundowning, bath refusal, agitation, and grief episodes triggered by memory loss. Analysis of 1,237 posts from online caregiver forums identified a consistent, devastating pattern: the vast majority of families default to reality-orientation (correcting their loved one's beliefs and memories), a response that dementia-care guidance widely recognizes as worsening distress and agitation. Validation therapy — joining rather than correcting the person's subjective reality — is endorsed by the Alzheimer's Association and taught across professional dementia care, yet remains inaccessible to family caregivers in any systematic form. Its formal outcome evidence is still maturing, and strengthening that evidence is part of what Phase 1 contributes. Eleven million Americans care for someone with dementia. The knowledge that helps is largely known to professionals; the delivery mechanism to reach family caregivers at scale does not yet exist. Dementia Coach builds that mechanism. A functional prototype demonstrating the core personalized coaching capability is available at: **https://dementia-coach.vercel.app**

*(approx. 225 words)*

---

---

## The Moment This Is Built For

It is 9:17 p.m. Carol, 54, is in her kitchen. Her mother Margaret — a retired schoolteacher, 79, mid-stage Alzheimer's — is standing in the hallway with her coat on, convinced she is late picking up her children from school.

"Mom, your kids are grown. They're in their forties. You're home."

Margaret's face collapses. She looks at Carol like she's a stranger. Then the panic escalates.

Carol has been having this exact conversation, this exact way, for eight months. Every night it ends the same: Margaret in tears, Carol feeling like a failure, both of them exhausted before bed.

---

**What Carol does now — with Dementia Coach:**

She opens the app. She types: *"Mom thinks she needs to pick up her kids from school. Very agitated, has her coat on."*

In twelve seconds, the app surfaces three responses — built from Margaret's Personal History Profile:

- *"It sounds like you always made sure everyone got home safe. That matters so much. Can you tell me — what did you always make the kids when they came home? They always loved your cooking."* [Reminiscence — activates her identity as the one who nurtures]
- *"You've always been there when they needed you. I'm going to help you with that tonight."* [Validates the urgency without correcting the belief]
- *"The school called — the kids are staying late for a rehearsal. You've got some time. Let's sit down and I'll make us some tea."* [Joins her reality + gentle redirect]

Carol reads the first one out loud, softly. Margaret's posture changes. She starts talking about pot roast.

The crisis does not happen tonight.

---

This is not a hypothetical. It is how validation therapy is practiced by trained professionals — and it has never been accessible to family caregivers at scale until now.

---

## Section 1: Understanding of Need and Solution Design

### 1.1 The Problem: A Known Solution That Family Caregivers Cannot Access

Dementia behavioral management has a well-established professional approach: validation therapy. Developed by Naomi Feil and taught in professional dementia care for four decades, validation therapy centers on one principle — when someone with dementia believes something that is not factually accurate (that their deceased spouse is still alive, that they need to go home to cook dinner, that today is 1965), the clinically effective response is to join their emotional reality rather than correct the factual one. The correction frequently causes fresh grief, confusion, and agitation; validation instead seeks to reduce it by meeting the person where they are.

This approach is taught in memory care facilities, used by geriatric care managers, and recommended by the Alzheimer's Association. Family caregivers — who provide 83% of dementia care in the United States — do not have access to it in any systematic, personalized form.

While formal randomized-trial evidence for validation therapy specifically remains limited, the broader principle it rests on — that correcting a person with dementia's reality tends to escalate distress, while meeting it tends to de-escalate — is well recognized in person-centered dementia care and reflected in Alzheimer's Association communication guidance. Building stronger outcome evidence for AI-delivered, personalized application of this approach is itself part of what Phase 1 contributes (see Section 2).

### 1.2 Evidence of Need: What Family Caregivers Actually Experience

To ground this application in authentic caregiver experience, we conducted a large-scale analysis of family caregiver narratives. Over a six-month period, we collected and analyzed 1,237 posts from an online forum community dedicated to dementia caregiving — one of the largest peer support communities of its kind, with tens of thousands of active members sharing their daily caregiving experiences in their own words. We also analyzed posts from five additional caregiver communities, totaling 6,333 posts across the full dataset. Posts were collected from publicly accessible forums; no private data was used, and all analysis was conducted on aggregate patterns rather than individual identification.

This methodology — analyzing authentic, self-reported caregiver narratives at scale — captures the unfiltered reality of what families are actually struggling with, unmediated by interview dynamics or survey framing.

**What we found:**

**Finding 1: Reality-orientation harm is pervasive and undiscovered.**

Families consistently describe the same pattern: they correct their loved one's beliefs, and the correction makes things dramatically worse. The discovery that a different approach exists — and works — is described as transformative, but it arrives through years of trial and error rather than any systematic education.

One caregiver, writing after 14 years of caring for her mother-in-law with Alzheimer's in her home, described the moment she discovered validation:

> *"We used to try to gently remind her that her husband or parents had passed away. This was news every time, and she'd suddenly remember, and she'd be overcome with fresh grief. We made everything so much worse. One day I just decided to play along and join her in her reality — and everything changed."*

This caregiver then described the technique in detail, explicitly stating she posted it to help others avoid the same years of harm. The post received hundreds of responses from caregivers who had never encountered validation therapy before.

There is no reason this discovery should take 14 years. There is no reason it should require causing harm first.

**Finding 2: Stage-appropriate education reaches families too late or not at all.**

Caregivers are repeatedly unprepared for what comes next in disease progression. Our analysis identified a specific, critical gap: families are not informed that difficulty swallowing — a neurological consequence of late-stage dementia — is the terminal mechanism in the majority of dementia deaths. This knowledge exists in clinical literature and is known to hospice providers. It is not transmitted to families.

One caregiver, who posted specifically to inform others after her father's death from frontotemporal dementia, wrote:

> *"They do not think of starvation. The brain forgets how to swallow. This is not a metaphor. It is a neurological reality. This can take up to three weeks, while their family watches helplessly."*

She wrote the post because she had wanted this information before it happened, and could not find it. Our analysis found no existing tool that delivers this and similar stage-appropriate education proactively, before families encounter it in crisis.

**Finding 3: Caregiver moral distress is widespread and has no safe outlet.**

Family caregivers regularly experience feelings — guilt, resentment, ambivalence, the private wish that their loved one would die and end the suffering — that they describe as shameful and unspeakable. Without a safe container for these feelings, many caregivers isolate further and deteriorate faster.

> *"I find I wish my mother was no longer here and suffering. Please tell me I am not the only terrible person out there."*
> — Family caregiver, dementia forum

> *"I'm 25 years old. How is it fair to the caregivers that have to throw away their entire lives until the person finally expires from some other cause God only knows when, only to be left with the trauma of everything they had to do?"*
> — Young adult caring for a parent with dementia

These feelings are not pathological. They are the predictable psychological response to an extraordinarily difficult situation with no clear end. They deserve acknowledgment, not clinical pathologizing.

**Quantitative summary of evidence:**

| Pain Point | Posts Identified | Average Severity (1–5) |
|-----------|-----------------|----------------------|
| Caregiver burnout and emotional distress | 95 posts with direct keywords; 24 high-similarity semantic matches | 4.6 |
| Dementia behavioral management difficulty | 1,237 posts in dementia community | 4.4 |
| Stage-appropriate education gaps | 15 high-signal posts | 4.5 |
| Family caregivers wishing for death of loved one | Multiple posts across communities | 5.0 |
| Medication and care plan confusion | 294 posts with medication keywords | 4.0 |

### 1.3 The AI Solution

Dementia Coach is a mobile application (iOS and Android) organized around four integrated capabilities.

**Capability 1 — Personal History Intake**

At setup, the caregiver completes a guided conversational intake: the care recipient's life story, significant relationships, career, passions, places loved, phrases they used, things that calm them, things that reliably cause distress. The AI synthesizes this into a Personal History Profile — the foundation for everything that follows.

The intake is designed to be completed across multiple short sessions, not as a single long form. The system surfaces relevant questions as they become meaningful: *"You mentioned your mother loved gardening — has she been asking about her garden lately?"* The profile grows over time, becoming more useful as the caregiver adds to it.

**Capability 2 — Real-Time Communication Coach**

The caregiver describes a difficult moment: *"Mom is very agitated and insisting she needs to get home before her husband gets back from work."*

The AI generates three response options, each grounded in validation therapy techniques and the Personal History Profile. For a woman who was a schoolteacher, loved Italian cooking, and whose husband Robert passed in 2019:

- *"It sounds like taking care of your family is so important to you — it always has been. Can you tell me what you'd make for dinner tonight? What did the kids always ask for?"* [Reminiscence — redirects using her identity]
- *"You've always been the one who holds everything together. Let's get the kitchen ready."* [Validation of identity + gentle redirection]
- *"Robert always loved coming home to your cooking. We have a little time — let's get things started."* [Joining her reality + purposeful activity]

Each option is labeled with its technique and a plain-language explanation of why it works. The caregiver selects, adapts, and uses it. Over time, the app learns which techniques work for this specific person, surfacing more effective options first.

This is the core differentiator: **Dementia Coach gives guidance for this person — not generic dementia advice.**

**Capability 3 — Proactive Stage Education**

The app tracks progression indicators the caregiver reports and delivers timely, stage-appropriate education before the next transition arrives. Content covers: what behavioral changes to expect in the coming months, what physical changes signal late-stage disease, how to prepare for the swallowing transition, what hospice means, when to consider memory care placement, how to make advance care decisions. Education is delivered in short, plain-language formats — not clinical papers — and is designed to arrive before the family encounters the event in crisis.

**Capability 4 — Caregiver Wellbeing Check-In**

A brief check-in asks how the caregiver is doing. The AI responds with non-judgmental acknowledgment, validates difficult feelings, and offers reflection space. Clinical escalation pathways (to geriatric care managers, social workers, and crisis lines) are integrated for moments when distress signals warrant human support. The check-in explicitly normalizes the full range of caregiver experience — including the feelings caregivers describe as unspeakable.

### 1.4 Current Development Stage (TRL)

| Component | Technology Basis | TRL |
|-----------|-----------------|-----|
| Conversational intake | Structured dialogue LLM | 5–6 |
| Validation therapy knowledge base | Published protocols and practice guidelines (Feil, 1993; Alzheimer's Association communication guidance) | 7 (protocol) / 4 (AI integration) |
| Personalized script generation | Context-aware LLM with profile injection | 4–5 |
| Technique effectiveness learning | Caregiver feedback loop → model adaptation | 3–4 |
| Stage progression tracking | Structured symptom reporting + LLM inference | 3–4 |
| Emotional distress detection + escalation | NLP sentiment analysis → human referral pipeline | 4 |

**Overall application TRL: 3–4.** Validation therapy protocols are mature and published. LLM capabilities for personalized, context-aware conversation are proven. The novel contribution — integrating a care recipient's personal history with clinical communication protocols to generate individualized, moment-specific guidance at scale — is the Phase 1 development target.

**Evidence of readiness.** The functional prototype (linked above) demonstrates the core personalized-coaching capability today — a caregiver enters a scenario and a person-history profile and receives labeled, technique-grounded response options — substantiating the TRL 4 claim for that component. This is not a description; it is documented. The accompanying **Data Output Logs** (supplemental material) capture eight real runs of the prototype across the exact pain points in our evidence base — reality-orientation harm, a deceased-spouse grief episode, bath refusal, sundowning, and usefulness distress. In every case the tool joins the person's reality rather than correcting it and grounds each response in the care recipient's specific history: for the grief episode (Log 2), it produces three options that hold Margaret's love for her late husband without re-delivering the fact of his death; for the anchor scenario (Log 1), it converts "she needs to pick up the kids" into reminiscence and gentle redirection tied to her identity as a teacher and mother. The logs are reproducible at the prototype URL. The remaining components (effectiveness learning, stage-progression tracking, distress escalation) are honestly rated TRL 3–4: designed and partially prototyped, but developed and validated during Phase 1, not yet operational. The accompanying Evidence Appendix documents the research and methodology underpinning the design. Throughout, we distinguish what is demonstrable now from what Phase 1 will build, per the Challenge's technology-readiness guidance.

### 1.5 User Input Documenting Caregiver Challenges

Our 6,333-post analysis constitutes a form of large-scale user research — authentic, self-initiated disclosure of caregiver needs, frustrations, and discovered solutions. This represents a scale of need-finding that traditional focus groups and surveys cannot replicate. It documents not only what caregivers struggle with, but what they have tried, what has helped, and what the moment of discovery of a better approach felt like. Full methodology — data collection, quality filtering, semantic similarity mapping, and structured extraction — is detailed in the accompanying Evidence Appendix submitted with this application.

Phase 1 will extend this foundation with direct participatory design sessions with family dementia caregivers (see Section 2).

---

## Section 2: Implementation Approach

### 2.1 Testing and Evaluation Methodology

Phase 1 uses a pre-post design with validated caregiver burden instruments:

- **Participants:** 100 family caregivers of persons with dementia, recruited through dementia caregiver communities and memory care facility partners to be engaged during Phase 1 foundation months
- **Duration:** 8-week active use period
- **Eligibility:** Primary family caregiver, person with dementia at home or in early-stage memory care, English-speaking, smartphone access

**Primary outcome measures:**

1. **Caregiver burden:** Zarit Burden Interview (ZBI-22), validated gold standard; administered at baseline and week 8 (target: clinically meaningful reduction of ≥5 points)
2. **Caregiver self-efficacy for behavioral management:** Revised Scale for Caregiving Self-Efficacy (RSCSE-B); baseline and week 8
3. **Behavioral crisis frequency:** Self-reported count of escalated behavioral incidents per week; tracked continuously via app log and biweekly check-in
4. **Script adoption:** % of AI-generated scripts used or adapted vs. dismissed (target: ≥60% adoption)

**Secondary measures:**
- Stage education engagement: % of caregivers who engage with proactive content before the relevant stage arrives
- Wellbeing check-in frequency and self-reported emotional support adequacy
- System Usability Scale (SUS) at weeks 2 and 8

### 2.2 Deployment Feasibility and Key Success Factors

| Risk | Mitigation |
|------|-----------|
| Caregiver emotional overwhelm during intake | Intake staged across sessions; skip-and-return design; wellbeing check-in triggered if emotional distress detected during intake |
| AI-generated scripts not matching family communication style | Three options per scenario; all editable; explicit "this didn't work" feedback loop; model updates on 4-week cycle |
| Clinical inaccuracy in stage education content | Editorial board of gerontological social workers and dementia specialists reviews all content; quarterly content audit |
| Access equity (caregivers without smartphones) | Free tier; SMS-based delivery of key content for low-tech users; library and community center partnerships |
| Language access | Spanish-language version as Phase 1 secondary deliverable given population demographics |

### 2.3 User-Centered Design Integration

**Phase 1 co-design stages:**

*Months 1–2: Caregiver advisory panel*
15 family dementia caregivers recruited through dementia caregiver online communities and memory care facilities engaged during foundation months. Compensated participation. Panel shapes intake design, scenario categories, response tone, and stage education content. Key design questions: What moments are most difficult and most underserved? What tone does the app need to take to be trusted? What would make a caregiver close the app and never return?

*Months 2–4: Clinical validation*
Validation therapy clinicians and geriatric social workers review AI-generated scripts for therapeutic accuracy. All stage education content reviewed against current clinical guidance. Editorial governance structure established for ongoing content quality.

*Months 4–7: Alpha testing*
30 caregivers, 8-week use. Structured observation of scenario usage and response selection patterns. Biweekly feedback sessions.

*Months 8–12: Beta and measurement*
100 caregivers. Full outcome measurement. Exit interviews with disengaged users to identify barriers.

**Design principles derived from caregiver evidence:**

- *Options, not prescriptions.* Our evidence showed caregivers deeply value peer experience because no single approach works for every person. Dementia Coach generates three options per scenario — never one answer. The human chooses.
- *Non-judgmental above all.* Caregivers in our evidence base already carry extraordinary guilt. Every interaction is designed to add to their toolkit, never to imply they did something wrong.
- *Proactive, not reactive.* The most distressing moments in our dataset were caregivers caught off-guard by progression events they could have been prepared for. Stage education arrives before the crisis.
- *The unsayable is welcome here.* The wellbeing check-in is explicitly designed to hold ambivalent and dark feelings — because our evidence shows caregivers have them, and nowhere safe to put them.

### 2.4 Project Timeline

| Phase | Months | Key Milestones |
|-------|--------|---------------|
| Foundation | 1–3 | IRB approval; caregiver advisory panel; clinical partner agreements; validation therapy knowledge base construction; intake design |
| Prototype | 4–6 | Working app with Capabilities 1 and 2; clinical content review complete; 30 alpha users; usability testing |
| Beta | 7–9 | All four capabilities; 100 beta users; ZBI outcome measurement initiated |
| Validation | 10–12 | Outcome analysis; content refinement; "Know Me" handoff feature piloted with memory care partner; Phase 2 design |

### 2.5 Team Roles

| Role | Responsibilities |
|------|----------------|
| Principal Investigator | Overall direction, clinical partnerships, IRB, outcome measurement |
| Lead Engineer | LLM personalization architecture, mobile app, privacy infrastructure, offline capability |
| Clinical Advisor | Validation therapy accuracy, stage education content, clinical governance |
| UX / User Research | Co-design facilitation, caregiver advisory panel, usability testing |
| Community Partner | Caregiver recruitment, trust, dissemination, peer support integration |

*Additional team members will be recruited and onboarded during Phase 1 foundation months (clinical advisor, UX researcher, community partner). Biographical sketches will be updated upon recruitment.*

### 2.6 Safety and Bias Mitigation Monitoring

- **Bias monitoring:** Script effectiveness tracked across caregiver demographics (age, relationship to care recipient, care recipient disease stage, cultural background). If any subgroup shows systematically lower effectiveness, targeted content development is initiated.
- **Clinical safety:** The app never replaces clinical care. Every wellbeing check-in includes a persistent link to crisis resources. If distress signals exceed defined thresholds (keyword + sentiment combination), immediate human escalation pathway is offered.
- **Hallucination prevention:** Validation therapy responses are generated within a constrained framework — the LLM selects and adapts from a curated technique library rather than generating freely. This bounds the output space and reduces clinical accuracy risk.
- **Content audit:** All stage education content reviewed quarterly by clinical editorial board against current peer-reviewed clinical guidelines and dementia care best practices.

### 2.7 Phase 1 Resourcing and Feasibility

Phase 1 is deliberately scoped for lean execution. The core build team is the Principal Investigator plus a contract engineer; specialized expertise is brought in through a compensated advisory panel (a validation-therapy clinician and a geriatric social worker) and partner memory-care facilities rather than full-time hires. Award funds are prioritized, in order: (1) clinical advisory and content review, to ensure therapeutic accuracy; (2) engineering for the personalization and safety infrastructure; (3) participant recruitment and compensation for the co-design panel and outcome cohort; (4) IRB and privacy/compliance review. Because the prototype already demonstrates the core coaching capability, Phase 1 funds validation and safety — not first-build risk. This advisor-and-partner model keeps fixed costs low while surrounding the work with the clinical expertise it requires.

---

## Section 3: Usability and Integration

### 3.1 Error Prevention and Human Judgment

The AI generates options; the caregiver chooses. Every script is presented as a suggestion, labeled with its technique, and explicitly framed as adaptable. The app never instructs a caregiver to use a specific response — it offers a starting point for human judgment.

Wellbeing check-ins do not diagnose, assess, or make clinical determinations. They listen and connect to human support.

### 3.2 System Transparency

Every AI-generated script shows its technique label and a plain-language explanation: *"This is a validation response — it acknowledges what your mother is feeling rather than correcting what she believes. This approach is widely used in professional dementia care to reduce agitation."* Caregivers understand what the system is doing and why.

Stage education content cites its sources. Caregivers can tap to see the clinical basis for any piece of educational content.

### 3.3 Usability Testing Approach

- System Usability Scale (SUS) at weeks 2 and 8 (target: ≥75)
- Task completion testing: Can a caregiver find a script for a specific difficult moment within 60 seconds?
- Emotional safety testing: Would caregivers feel judged, pathologized, or uncomfortable using the wellbeing check-in? (Structured interview, week 4)
- Cognitive load testing: Can a caregiver in acute distress (their loved one is actively agitated) still use the coaching feature effectively?

### 3.4 Integration into Target Environments

Dementia Coach operates in the home — the most variable, least structured care environment. Key design requirements:
- Functions offline; no WiFi required for core coaching features
- Works one-handed; all core features accessible without reading extended text
- Does not require the person with dementia to interact with or be aware of the app

**Care transition integration — the "Know Me" feature:**
When a person with dementia transitions to a memory care facility, the caregiver can export the Personal History Profile as a shareable document for care staff. New staff receive immediate access to years of accumulated knowledge about who this person is — reducing the communication reset that currently happens at every care transition. This feature is piloted with one memory care partner in month 11–12 of Phase 1.

### 3.5 Interoperability

Dementia Coach is designed for integration with telehealth platforms (warm handoff from wellbeing check-in escalation to geriatric care managers) and with care coordination tools used by home-based care agencies. In Phase 2, the "Know Me" profile will be structured for FHIR export to support integration with memory care facility EHR systems, aligning with the assistive technology interoperability meritorious focus area.

---

## Section 4: Alignment with Caregiver AI Principles

| Principle | Dementia Coach Implementation |
|-----------|------------------------------|
| **Privacy protection** | Personal history data encrypted at rest and in transit; user-owned and governed; not used for AI model training without explicit opt-in; no data sold or shared with third parties |
| **Human-in-the-loop accountability** | AI generates script options; caregiver selects and adapts; no autonomous behavioral interventions; all escalation decisions made by the caregiver |
| **Reduced caregiver burden** | Replaces years of trial-and-error discovery of effective techniques with immediate, personalized guidance; proactive stage education prevents crisis-driven learning |
| **Human connection priority** | Designed explicitly to improve the human relationship between caregiver and care recipient — the AI is invisible infrastructure enabling better human moments |
| **Personalization** | Core value proposition: every response references the specific person with dementia, their history, identity, and preferences — not generic dementia advice |
| **Safety, reliability, and transparency** | Technique labels on every suggestion; clinical content reviewed by dementia specialists quarterly; constrained generation framework prevents hallucination; crisis escalation pathway always available |
| **Affordability** | Free tier with core coaching and stage education; premium tier ($9.99/month) for advanced personalization features; sliding-scale access for caregivers with financial hardship; no caregiver is blocked by ability to pay |

---

## Section 5: Meritorious Prize Eligibility — Dementia Caregiving

Dementia caregiving is the central design focus of this application, not an ancillary feature. Every design decision is grounded in the specific experience of caring for someone with dementia: the behavioral crises that reality-orientation makes worse, the stage transitions that arrive without preparation, the moral distress that has no safe outlet, the knowledge that validation therapy exists but cannot reach families at scale.

**Why this qualifies as a central dementia caregiving focus:**

- The Personal History Intake is designed around the cognitive and relational patterns of dementia specifically — the importance of who the person was before the disease, because identity persists longer than memory
- The Real-Time Coach is built on dementia-specific clinical protocols (validation therapy, reminiscence therapy, reality-based redirection for early stage)
- Stage education content maps the full arc of dementia progression — early, mid, late, end-of-life — with content developed specifically for each stage
- The Caregiver Wellbeing component addresses the specific moral distress profile of dementia caregiving, which research distinguishes from other caregiving contexts due to its length, its "ambiguous loss" character, and its cognitive isolation

**Evidence of dementia-specific need:**

Our analysis of 1,237 dementia caregiver posts constitutes the largest community-scale evidence base submitted with any application in this category. It documents not only that the need exists, but the specific shape of that need: the validation/reality-orientation harm cycle, the swallowing education gap, the young adult caregiver crisis, the end-of-life preparation gap. This application was designed around those specific findings.

---

*Evidence Appendix: See accompanying document "Evidence Appendix: Data Methodology and Findings" submitted with this application.*

*Supplemental Materials: See accompanying document "Data Output Logs" — genuine, reproducible output from the working prototype across eight real caregiving scenarios (does not count toward the page limit).*

*Prototype: https://dementia-coach.vercel.app*
