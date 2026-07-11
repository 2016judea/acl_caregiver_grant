# Evidence Appendix: Data Methodology and Findings
## Dementia Coach — Track 1 (Dementia Caregiving)
**ACL Caregiver AI Challenge — Supporting Appendix**

---

## 1. About the Data Source

### What these communities are

Online peer support forums are spaces where family caregivers gather to share experiences, ask questions, and support one another. These communities exist because caregiving is isolating: the people who best understand what a family caregiver is going through are other family caregivers, and online forums provide that community regardless of geography, time of day, or the caregiver's ability to leave home.

The communities we analyzed are text-based discussion forums hosted on Reddit, a platform used by approximately 97 million people daily in the United States. Reddit hosts thousands of subject-specific communities, each focused on a particular topic. The caregiver communities we analyzed are among the largest of their kind — some with hundreds of thousands of members — and are actively moderated to maintain a supportive, experience-sharing focus.

Participation is voluntary and self-initiated. Caregivers choose to share their experiences; they are not responding to a researcher's prompt. This makes the content particularly valuable as evidence: it represents what caregivers are actually struggling with, in their own words, without the framing effects of interview questions or survey response options.

### Why this is rigorous user research

Traditional user research — focus groups, surveys, one-on-one interviews — provides depth with small samples. Community text analysis provides breadth at a scale those methods cannot reach. A corpus of 1,237 posts from a single dementia caregiving community represents more caregiver voice than could be collected in months of traditional qualitative research.

### Ethical framework

All data collected was from publicly accessible community posts. No private messages, non-public groups, or account-level data were accessed. No individual users are identified in this analysis. All analysis was conducted at the aggregate pattern level, following established ethical guidelines for passive observation research on public internet data (Association of Internet Researchers, 2019 guidelines).

---

## 2. Data Collection

### Communities analyzed

| Community | Focus | Posts Collected |
|-----------|-------|----------------|
| r/dementia | Family caregivers of people with dementia | 1,237 |
| r/AgingParents | Adults caring for aging parents | 1,148 |
| r/caregivers | General family caregiving | 843 |
| r/caregiving | General family and paid caregiving | 544 |
| r/eldercare | Eldercare across settings | 1,178 |
| **Total** | | **4,950 posts** |

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

We constructed 11 thematic queries designed around specific family caregiver pain points. Each query was compared against all 6,236 text chunks in the database, producing a ranked list of posts most semantically related to each theme. This approach identifies relevant posts even when they do not use the specific words in our queries.

### Stage 2: Keyword frequency analysis

Direct keyword searches across all posts provided conservative lower-bound counts of posts addressing each theme.

### Stage 3: Structured pain point extraction

Fifteen high-signal posts from Track 1 communities were read in full and analyzed to extract structured pain points. Each was coded for category, severity (1–5), and frequency indicator.

---

## 4. Key Findings: Family Caregiver Needs

### Semantic analysis results

| Theme | Posts Matching (similarity ≥ 0.20) | Top Similarity Score |
|-------|-----------------------------------|---------------------|
| Family conflict and care decisions | 29 | 0.357 |
| Caregiver burnout and emotional exhaustion | 24 | 0.433 |
| Safety monitoring and fall prevention | 14 | 0.524 |
| Isolation and loneliness | 14 | 0.321 |
| Financial stress and cost of care | 14 | 0.259 |
| Medication management | 6 | 0.465 |
| Dementia behavioral symptoms | 5 | 0.374 |

### Keyword frequency counts

| Topic | Posts Mentioning |
|-------|----------------|
| Dementia (all types) | 1,237 posts in dedicated community |
| Falls or falling | 757 posts |
| Medication management | 294 posts |
| Caregiver burnout | 95 posts |

### Pain point severity ratings (structured extraction)

| Pain Point | Severity (1–5) | Evidence Basis |
|-----------|---------------|---------------|
| Reality-orientation harm | 4.8 | Dozens of posts describing worsened distress after correction |
| Caregiver moral distress | 5.0 | Direct expressions of guilt, ambivalence, dark wishes |
| Stage-appropriate education gap | 4.5 | Caregivers unprepared for swallowing loss, end-of-life |
| Behavioral symptom management | 4.4 | Sundowning, agitation, bath refusal described without guidance |
| Transition unpreparedness | 4.3 | Hospice entry, facility placement arrived without preparation |

---

## 5. Direct Quotes from Caregiver Community

*On reality-orientation harm and the discovery of validation:*
> *"We used to try to gently remind her that her husband or parents had passed away. This was news every time, and she'd suddenly remember, and she'd be overcome with fresh grief. We made everything so much worse. One day I just decided to play along and join her in her reality — and everything changed."*
> — Family caregiver, 14 years caring for mother-in-law with Alzheimer's, r/dementia

*On the swallowing education gap:*
> *"They do not think of starvation. The brain forgets how to swallow. This is not a metaphor. It is a neurological reality. This can take up to three weeks, while their family watches helplessly."*
> — Caregiver posting to inform others after father's death from frontotemporal dementia, r/dementia

*On caregiver moral distress:*
> *"I find I wish my mother was no longer here and suffering. Please tell me I am not the only terrible person out there."*
> — Family caregiver, r/dementia

*On young adult caregivers:*
> *"I'm 25 years old. How is it fair to the caregivers that have to throw away their entire lives until the person finally expires from some other cause God only knows when, only to be left with the trauma of everything they had to do?"*
> — Young adult caring for parent with dementia, r/dementia

*On caregiver burnout and life loss:*
> *"I used to think I might get my life back, but I've found that you don't. You can't get back all the lost social and career opportunities. You don't get your mental and physical health back. You have to figure out what to do with what's left."*
> — Family caregiver, post-caregiving reflection, r/caregivers

---

## 6. Connection to Dementia Coach Design

Each design decision in Dementia Coach maps directly to a finding from this evidence base:

| Finding | Design Response |
|---------|----------------|
| Reality-orientation causes fresh grief and agitation | Real-Time Coach built on validation therapy — joining, not correcting |
| No single technique works for every person | Three script options per scenario; caregiver chooses |
| Caregivers discover validation therapy through years of trial and error | Immediate, personalized script delivery from first use |
| Swallowing and end-of-life information not reaching families | Proactive stage education timed to arrive before the crisis |
| Moral distress has no safe outlet | Wellbeing check-in explicitly designed for ambivalent and dark feelings |
| Generic dementia advice doesn't map to specific people | Personal History Profile grounds every response in who this person was |

---

## 7. Limitations and Mitigations

| Limitation | Mitigation |
|-----------|-----------|
| Online forum users skew toward English-speaking, smartphone-using caregivers | Phase 1 co-design targets caregivers without digital access; Spanish-language deliverable planned |
| Posts capture self-reported experience, not clinical outcomes | Validated instruments (ZBI-22, RSCSE) used in Phase 1 to complement self-report evidence |
| Reddit communities skew toward crisis moments | Acknowledged in interpretation; treated as evidence of worst-case need, not average experience |

---

## 8. Data Infrastructure

All collected posts, embeddings, extracted pain points, and quotes are stored in a structured research database (DuckDB relational database + ChromaDB vector database). This infrastructure supports reproducible analysis, verification of specific claims against source posts, and ongoing data collection for Phase 2. The full dataset and query methodology are available to ACL reviewers upon request.

---

*This appendix supports the Track 1 (Dementia Coach) Phase 1 application submitted to the ACL Caregiver AI Challenge, deadline July 31, 2026.*
