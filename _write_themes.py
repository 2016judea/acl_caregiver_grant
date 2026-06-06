import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dotenv import load_dotenv; load_dotenv()
from src.db import init_db, get_duck; init_db()
from src.ingest_analysis import write_theme_summary, db_summary
conn = get_duck()

themes = [
    # ── TRACK 1 ──────────────────────────────────────────────────────────────
    {
        "theme": "T1-caregiver-burnout-life-loss",
        "track_relevance": "T1",
        "post_count": 24,
        "avg_severity": 4.6,
        "top_categories": "caregiver-burnout, emotional-support, moral-distress",
        "description": "Family caregivers describe permanent, irreversible loss of career, health, social life, and identity from long-term caregiving. Young adult caregivers (20s-30s) are particularly affected. Emotional toll includes moral distress, guilt, ambivalence, and taboo feelings (wishing loved one would die) with no safe outlet.",
        "sample_quote": "I used to think I might get my life back, but I've found that you don't. You can't get back all the lost social and career opportunities.",
        "application_angle": "AI companion and emotional support tool that offers non-judgmental space for caregivers to express distress, provides validated coping strategies, and connects to respite resources — addressing ACL principles of human connection and burden reduction.",
    },
    {
        "theme": "T1-dementia-education-gap",
        "track_relevance": "T1",
        "post_count": 15,
        "avg_severity": 4.5,
        "top_categories": "information-access, dementia-behavioral-management, caregiver-education",
        "description": "Family caregivers lack clinical knowledge about dementia progression that would dramatically change their approach: dysphagia/starvation as terminal mechanism, validation vs. reality-orientation techniques, end-stage behavioral patterns. This knowledge gap causes unnecessary distress and worsened patient outcomes.",
        "sample_quote": "They do not think of starvation. The brain forgets how to swallow. This can take up to three weeks, while their family watches helplessly.",
        "application_angle": "Personalized AI guide that delivers stage-appropriate dementia education, teaches validation communication techniques, and prepares families for what end-stage looks like — targeting the $50K dementia meritorious bonus area.",
    },
    {
        "theme": "T1-care-navigation-system-complexity",
        "track_relevance": "T1",
        "post_count": 12,
        "avg_severity": 4.2,
        "top_categories": "care-coordination, financial-planning, information-access",
        "description": "Navigating medical, housing, legal, and financial systems for aging parents is described as bewildering and constantly shifting. Families don't know about Medicaid five-year lookback until crisis, don't understand levels of care, and lack decision-support tools. Real costs ($120K+ for AL, $250K for IDD group homes) are unknown until too late.",
        "sample_quote": "Constantly trying to re-assess their continually failing abilities and what they need next — the ground constantly shifting underfoot.",
        "application_angle": "AI care-navigation assistant that guides families through care level decisions, benefit eligibility, and proactive financial planning — aligned with ACL's affordability and personalization principles.",
    },
    {
        "theme": "T1-safety-monitoring-falls",
        "track_relevance": "T1",
        "post_count": 14,
        "avg_severity": 3.8,
        "top_categories": "fall-prevention, safety-monitoring",
        "description": "Falls are the precipitating event for many caregiving crises and the first moment families confront mortality. Families actively seek fall detection systems, home monitoring cameras, and medical alert devices but face confusing product landscape. Cognitively declining seniors cannot operate complex security systems.",
        "sample_quote": "Home security for elderly parents requires different considerations than standard security systems. The confusion around operating complex security panels makes them useless for cognitively declining seniors.",
        "application_angle": "AI-integrated safety monitoring platform with cognitively accessible interfaces, fall detection, and family alert systems — strongest single AI application anchor in the dataset with 0.524 semantic similarity score.",
    },
    {
        "theme": "T1-medication-management",
        "track_relevance": "T1",
        "post_count": 6,
        "avg_severity": 4.0,
        "top_categories": "medication-management",
        "description": "Managing 10+ medications for elderly parents is mentally draining — tracking dosages, refills, interactions, and adherence. One caregiver discovered parent taking entire week's supply in days. Legal ambiguity around hospice comfort kit medications created criminal risk for one family caregiver.",
        "sample_quote": "They're in their 70s and take over 10 different meds, and it's mentally draining keeping track of everything — dosages, refills, interactions.",
        "application_angle": "AI medication management assistant with smart dispenser integration, adherence tracking, and caregiver alerts — directly addresses hospice comfort kit guidance gap that put one caregiver at criminal risk.",
    },
    # ── TRACK 2 ──────────────────────────────────────────────────────────────
    {
        "theme": "T2-staffing-ratio-crisis",
        "track_relevance": "T2",
        "post_count": 70,
        "avg_severity": 5.0,
        "top_categories": "staffing-ratios, patient-safety, worker-protection",
        "description": "Legal ratios (1:8) are routinely violated — CNAs regularly report 1:14, 1:21, even 1:35 ratios. This drives both patient safety incidents (missed stroke, fatal trach error) and CNA burnout/attrition. CNAs are then written up for care lapses caused by facility-imposed impossible ratios, with no objective documentation to defend themselves.",
        "sample_quote": "Legislation says the ratio is supposed to be 1:8 during the day but most of the time this month it's been 1:21 per hall with a float.",
        "application_angle": "Real-time staffing ratio tracking and documentation tool that creates timestamped records of actual vs. required ratios, protecting both workers and facilities — addresses scheduling, staffing, and documentation burden in one AI application.",
    },
    {
        "theme": "T2-compensation-workforce-shortage",
        "track_relevance": "T2",
        "post_count": 68,
        "avg_severity": 4.8,
        "top_categories": "compensation, workforce-retention, low-wages",
        "description": "CNA wages ($16-$17/hr at SNFs) lag private duty market ($21+/hr) by enough that experienced CNAs are exiting to private arrangements or leaving healthcare entirely. Facilities compound this with inadequate recognition, part-time-only availability, and mandatory overtime — creating a retention crisis the workforce describes as 'this is why there is a shortage.'",
        "sample_quote": "I really wonder why they think an experienced CNA is going to work for pennies at a nursing home. This is why there is a shortage and nobody wants to work.",
        "application_angle": "AI-powered workforce marketplace and scheduling tool that matches CNAs to facilities offering fair wages and flexible hours — addresses Track 2 workforce efficiency and retention mandate.",
    },
    {
        "theme": "T2-worker-protection-documentation",
        "track_relevance": "T2",
        "post_count": 43,
        "avg_severity": 4.3,
        "top_categories": "worker-protection, documentation-tools, shift-handoff",
        "description": "CNAs have no tools to document care delivery, report ratio violations anonymously, or prove false patient/nurse accusations. Missing shift baseline documentation caused a CNA to miss a stroke. Charting infrastructure (wall kiosks vs. computers) signals and enforces second-class status. Without systematic documentation, CNAs bear individual liability for system failures.",
        "sample_quote": "The nurse prior didn't give a baseline. There was no way of knowing how long the patient had been in that state.",
        "application_angle": "CNA-first documentation app with voice-to-chart, real-time care timestamping, and anonymous ratio reporting — addresses documentation burden (173 keyword hits) and shifts accountability to the system level.",
    },
    {
        "theme": "T2-workforce-attrition-burnout",
        "track_relevance": "T2",
        "post_count": 319,
        "avg_severity": 4.5,
        "top_categories": "workforce-retention, workplace-safety, emotional-labor",
        "description": "CNAs describe becoming CNAs as their biggest mistake, experiencing chronic physical injury (back, muscle pain), verbal and physical abuse from residents with no consequence, and complete lack of mental health support after traumatic exposures. Mass attrition triggered by visible undervaluation — one facility lost multiple CNAs after giving hand sanitizer as a 5-year recognition award.",
        "sample_quote": "Work without any downtime is not sustainable. Everywhere else harassment is illegal. Not in nursing homes.",
        "application_angle": "AI-powered CNA wellbeing and retention platform — incident reporting, peer support, mental health resources, and burnout early-warning — addressing Track 2 mandate to extend the caregiver workforce.",
    },
]

for t in themes:
    write_theme_summary(conn, t)

print(f"Written {len(themes)} theme summaries")
print(db_summary(conn))
