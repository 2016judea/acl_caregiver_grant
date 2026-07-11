# Evidence Appendix: Data Methodology and Findings
## CNA Shield — Track 2 (Direct Care Workforce)
**ACL Caregiver AI Challenge — Supporting Appendix**

---

## 1. About the Data Source

### What these communities are

Online peer support forums are spaces where direct care workers — Certified Nursing Assistants, home health aides, and other frontline caregivers — gather to share experiences, ask questions, and support one another. These communities exist because direct care work is isolating and under-resourced: the people who best understand what a CNA goes through on a 1:14 shift are other CNAs, and online forums provide that community regardless of geography or schedule.

The communities we analyzed are text-based discussion forums hosted on Reddit, a platform used by approximately 97 million people daily in the United States. The r/CNA community is one of the largest direct care worker communities of its kind, with members across nursing facilities, memory care units, and home care settings sharing unfiltered accounts of daily working conditions.

Participation is voluntary and self-initiated. Workers choose to share their experiences without researcher presence or prompting. This makes the content particularly valuable: it represents what CNAs are actually experiencing, in their own words, without the framing effects of employer-administered surveys or structured interviews.

### Why this is rigorous user research

Traditional user research — focus groups, surveys — faces a specific problem with direct care workers: CNAs employed by facilities may not speak freely in employer-adjacent research contexts. Anonymous online peer communities capture candid disclosure that traditional methods cannot. A corpus of 1,324 posts from working CNAs represents a scale and authenticity of need-finding that no conventional research approach could replicate.

### Ethical framework

All data collected was from publicly accessible community posts. No private messages, non-public groups, or account-level data were accessed. No individual workers are identified in this analysis. All analysis was conducted at the aggregate pattern level, following established ethical guidelines for passive observation research on public internet data (Association of Internet Researchers, 2019 guidelines).

---

## 2. Data Collection

### Communities analyzed

| Community | Focus | Posts Collected |
|-----------|-------|----------------|
| r/CNA | Certified Nursing Assistants and direct care workers | 1,324 |
| r/eldercare | Eldercare across settings | 1,178 |
| r/caregivers | General family and paid caregiving | 843 |
| r/caregiving | General family and paid caregiving | 544 |
| **Total** | | **3,889 posts** |

### Collection methodology

Posts were collected using Reddit's publicly accessible data interface on April 19, 2026. Collection captured posts from three feed types — "hot" (currently active), "top/year" (highest-engagement posts from the past year), and "top/all-time" (highest-engagement posts ever) — to ensure representation of both current and historically significant content.

### Quality filtering

| Filter | Result |
|--------|--------|
| Removed: posts under 50 words | Eliminated low-content posts |
| Removed: spam, promotional content, moderator announcements | Automated pattern detection |
| Removed: near-duplicate posts (>85% word overlap) | Deduplication pass |
| **Retained** | **66% of collected volume** |

---

## 3. Analysis Methodology

### Stage 1: Semantic similarity mapping

All retained posts were converted to numerical representations (embeddings) using a pre-trained language model (all-mpnet-base-v2, a sentence-level semantic encoding model). These representations capture meaning — two posts expressing the same concern in different words are recognized as similar.

A key methodological insight: CNAs write in colloquial, emotional language ("I quit," "1:21 ratio," "pennies"), not clinical vocabulary. Initial queries using clinical terminology (e.g., "documentation burden in long-term care") produced weak matches. We redesigned queries using CNA-native language (e.g., "CNA quit nursing home burned out") and produced strong results, confirming data presence while explaining why keyword-only approaches undercount CNA concerns.

### Stage 2: Keyword frequency analysis

Direct keyword searches across all posts provided conservative lower-bound counts of posts addressing each theme.

### Stage 3: Structured pain point extraction

Fifteen high-signal posts from Track 2 communities were read in full and analyzed to extract structured pain points. Each was coded for category, severity (1–5), frequency indicator, and direct quote potential.

---

## 4. Key Findings: Direct Care Workforce Needs

### Semantic analysis results (CNA-native language queries)

| Theme | Top Similarity Score | Evidence Quality |
|-------|---------------------|-----------------|
| Low pay and wages | 0.506 | Strong |
| Workforce retention and quitting | 0.410 | Strong |
| Short-staffing crisis | 0.398 | Strong |
| I/DD direct support workforce | 0.395 | Moderate |
| Abusive clients and safety | 0.252 | Moderate |

### Keyword frequency counts

| Topic | Posts Mentioning |
|-------|----------------|
| Staffing ratios (patient-to-aide counts) | 338 posts |
| Quitting or leaving healthcare | 319 posts |
| Charting, documentation, or paperwork | 92 posts |
| Short-staffing or understaffing | 42 posts |
| Abusive clients or workplace safety | 78 posts |
| Wage or pay concerns | 68 posts |

### Pain point severity ratings (structured extraction)

| Pain Point | Severity (1–5) | Evidence Basis |
|-----------|---------------|---------------|
| Ratio violations with no protected reporting mechanism | 4.8 | 338 posts; specific violations documented in CNAs' own words |
| Documentation burden during hands-on care | 4.6 | 92 charting posts; physical impossibility of typing while providing care |
| Shift handoff failures creating patient safety risk | 4.7 | Direct cases of missed neurological baselines |
| Workforce attrition from unsustainable conditions | 4.5 | 319 posts describing quitting or planning to quit |
| Worker protection gap when conditions cause care lapses | 4.9 | CNAs disciplined for lapses caused by facility-imposed ratios |

---

## 5. Direct Quotes from CNA Community

*On staffing ratio violations:*
> *"Legislation says the ratio is supposed to be 1:8 during the day but most of the time this month it's been 1:21 per hall with a float."*
> — CNA who attempted to report their facility to state regulators, r/CNA

*On consequences of impossible ratios:*
> *"Ratio went up to 10:1. Third night, 14:1. I was running around non-stop. She's written me up for neglecting and ignoring a patient's needs."*
> — CNA disciplined for care lapses caused by facility-imposed staffing conditions, r/CNA

*On workforce sustainability:*
> *"I'm tired of the impossible CNA to patient ratio. I'm tired of not having a single second of downtime on my shifts. Work without any downtime is not sustainable."*
> — CNA describing physical and mental deterioration from working conditions, r/CNA

*On wages and the workforce shortage:*
> *"I really wonder why they think an experienced CNA is going to work for pennies at a nursing home. This is why there is a shortage and nobody wants to work."*
> — CNA who ended a job interview when offered $16.50/hour after three years of experience, r/CNA

*On shift handoff failures:*
> *"The charge nurse had to ask me if the patient was forming normal sentences when I last saw them. The nurse prior didn't give a baseline. There was no way of knowing how long the patient had been in that state."*
> — CNA reflecting on a shift in which a patient may have suffered an undetected stroke, r/CNA

*On documentation infrastructure:*
> *"In orientation they said 'we have computers in the nursing station but we encourage you NOT to use them. There are kiosks mounted on the wall specifically for the CNAs.' The kiosks make your arm hurt and your feet are already killing you. I'm fed up with the way we're treated."*
> — CNA describing second-class documentation infrastructure, r/CNA

---

## 6. Connection to CNA Shield Design

Each module of CNA Shield maps directly to a finding from this evidence base:

| Finding | Design Response |
|---------|----------------|
| CNAs cannot chart while providing hands-on care | Module 1: Voice Care Logging — speak observations hands-free throughout the shift |
| No structured handoff equivalent to nursing's SBAR | Module 2: Shift Handoff Assistant — AI synthesizes voice logs into structured handoff |
| Ratio violations exist but reporting is dangerous | Module 3: Safe Ratio Reporting — aggregate, anonymized, timestamped ratio documentation |
| "Anonymous" reporting is traceable (name in email) | Differential privacy pipeline; plain-language explanation of anonymization mechanism |
| Documentation systems designed for nurses, not CNAs | Voice-first, hands-free design; no scrolling, no typing during care |
| Worker disciplined for lapses caused by facility conditions | Timestamped objective record of actual assignment and care events |

---

## 7. Limitations and Mitigations

| Limitation | Mitigation |
|-----------|-----------|
| Online forum users skew toward English-speaking, smartphone-using CNAs | Phase 1 co-design targets CNAs across facility types; multi-accent voice model training |
| Posts capture self-reported experience, not verified workplace conditions | Validated outcome instruments (Anticipated Turnover Scale, SUS) used in Phase 1 |
| Reddit communities skew toward crisis moments | Acknowledged in interpretation; treated as evidence of worst-case need, not average experience |
| r/CNA may underrepresent home health and I/DD settings | Phase 1 recruits across SNF, memory care, and home care settings |

---

## 8. Data Infrastructure

All collected posts, embeddings, extracted pain points, and quotes are stored in a structured research database (DuckDB relational database + ChromaDB vector database). This infrastructure supports reproducible analysis, verification of specific claims against source posts, and ongoing data collection for Phase 2. The full dataset and query methodology are available to ACL reviewers upon request.

---

*This appendix supports the Track 2 (CNA Shield) Phase 1 application submitted to the ACL Caregiver AI Challenge, deadline July 31, 2026.*
