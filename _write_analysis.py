"""Write extracted pain points and quotes from batch analysis of 30 posts."""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dotenv import load_dotenv; load_dotenv()
from src.db import init_db, get_duck; init_db()
from src.ingest_analysis import write_pain_points, write_quotes, write_theme_summary, db_summary
conn = get_duck()

# ── TRACK 1: Family Caregiver Pain Points ────────────────────────────────────
t1_pain_points = [
    # 1qhmx6b — dementia death, emotional devastation
    {"post_id": "1qhmx6b", "pain_point": "No adequate preparation for grief after years of dementia caregiving — caregivers believe they are ready for death but are not",
     "category": "emotional-support", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I thought I was ready, I was not. I pray for all the caregivers in this group and for all the people who are watching a loved one go through this."},

    # 1p3a6kh — wrongly charged with murder after home hospice death
    {"post_id": "1p3a6kh", "pain_point": "Family caregivers face criminal investigation after home hospice deaths with no legal protection or guidance on comfort kit medication administration",
     "category": "care-navigation", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "isolated", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I was wrongly charged with murder after my mom died in hospice from Alzheimer's and cancer. Now I'm trying to prevent the same thing from happening to other caregivers."},
    {"post_id": "1p3a6kh", "pain_point": "Hospice providers give inadequate or no instructions to family caregivers on what comfort kit medications are legal and safe to administer",
     "category": "medication-management", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "isolated", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "We grabbed our comfort kit from the house... after three days"},

    # 1s1ggmt — NPR caregiving story, career/life losses
    {"post_id": "1s1ggmt", "pain_point": "Career and financial losses from caregiving are permanent and never recovered — social opportunities, client relationships, and income cannot be regained",
     "category": "caregiver-burnout", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I used to think I might get my life back, but I've found that you don't. You can't get back all the lost social and career opportunities."},
    {"post_id": "1s1ggmt", "pain_point": "Society romanticizes caregiving as redemptive while ignoring permanent physical, mental, and economic toll on caregivers",
     "category": "caregiver-burnout", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I lost my biggest client because I didn't have time to do the work he needed me to do. I resented it."},

    # 1rqdw8b — mom fell, discovered mortality
    {"post_id": "1rqdw8b", "pain_point": "Falls trigger sudden confrontation with parent's mortality for which families have no tools or proactive plans",
     "category": "fall-prevention", "track_relevance": "T1", "severity_score": 3,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "She fell. It's not the first time, but it's the first time she got hurt - she sprained her wrist."},

    # 1iv9b2x — "It's over", navigating systems across states
    {"post_id": "1iv9b2x", "pain_point": "Navigating fragmented medical and housing systems across multiple states with no decision-support — caregivers describe it as the ground constantly shifting underfoot",
     "category": "care-coordination", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "constantly trying to re-assess their continually failing abilities and what they need next, learning about the levels of care, worrying about my mom's dementia, thinking through all the critical little specifics"},
    {"post_id": "1iv9b2x", "pain_point": "Caregiver traveled 2-3 weeks out of every month over sustained period, leading to alcohol overuse, abandoned fitness, health deterioration",
     "category": "caregiver-burnout", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "too much drinking, forgot what the gym is, my own health nos"},

    # 17bdc1v — dementia moral distress at 25
    {"post_id": "17bdc1v", "pain_point": "Young adult caregivers (20s) experience compounded trauma — sacrificing formative life years with no support and no end date",
     "category": "caregiver-burnout", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I'm 25 years old. How is it fair to the caregivers that have to throw away their entire lives until the person finally expires from some other cause God only knows when, only to be left with the trauma of everything they had to do"},
    {"post_id": "17bdc1v", "pain_point": "No safe, non-judgmental outlet for caregivers to express moral distress or ambivalence about end-of-life quality of care",
     "category": "emotional-support", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "All you ever hear is oh but they don't suffer... bullshit. You can immediately tell who has never had to actually deal with it."},

    # 1lhgt7k — death, hospice morphine inadequate
    {"post_id": "1lhgt7k", "pain_point": "Hospice pain medication inadequate — caregiver watched non-verbal father cry out during care with pain untouched by morphine",
     "category": "end-of-life", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I watched my no-longer-verbal dad cry out as nurses had to change him, the pain untouched by the hospice morphine. I watched him sob at the grandkids he missed."},

    # 1r9vh10 — early aging in 60s
    {"post_id": "1r9vh10", "pain_point": "Early-onset functional decline starting in the 60s creates unexpected caregiving burden before families recognize they are caregivers",
     "category": "care-coordination", "track_relevance": "T1", "severity_score": 3,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "My father is in his early sixties. EARLY SIXTIES. He's confused at basic tasks of daily living and reacts with toddler-level tantrums when he realises he no longer understands how to do things."},

    # 1me2v0v — dementia moral distress, wishing loved one gone
    {"post_id": "1me2v0v", "pain_point": "Caregivers experience intense guilt and isolation for secretly wishing their loved one would die and end the suffering — no safe space to express this",
     "category": "emotional-support", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I find I wish my mother was no longer here and suffering. Please tell me I am not the only terrible person out there."},

    # 1gxnvaf — FTD/PPA end stage, no information
    {"post_id": "1gxnvaf", "pain_point": "Families have no access to accurate descriptions of what end-stage dementia looks like — must discover through lived experience what clinical staff know",
     "category": "information-access", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "This is something I wanted to know so I'm posting it for others. My father passed away this week after battling FTD/PPA for 5 years."},
    {"post_id": "1gxnvaf", "pain_point": "Practical daily care skills for late-stage dementia (adapted feeding, incontinence management, communication with non-verbal patients) not taught to families",
     "category": "caregiver-education", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "Slowly things would be taken away from him... eating complex foods, dexterity with his hands, ability to wipe his butt, hold his pee, understand how to work a toilet"},

    # 1j6yu55 — healthcare cost reality
    {"post_id": "1j6yu55", "pain_point": "Families have no accurate expectations about eldercare costs ($120K+/year for AL, $250K for IDD group homes) and no proactive planning tools",
     "category": "financial-planning", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "People like my husband that aren't in this world have no idea how much things cost. I've seen assisted livings charge $15k+ per month. I've seen group homes for IDD charge $250k per year."},
    {"post_id": "1j6yu55", "pain_point": "Medicaid five-year lookback and legal planning complexity not known to most families until crisis — requires attorney engagement most can't access",
     "category": "financial-planning", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "Work with an elder care law attorney. Medicaid does a five year look back on everything. So you have to plan really far in advance."},

    # 1meu2u0 — $120K assisted living, caregiver spouse exhausted
    {"post_id": "1meu2u0", "pain_point": "Spousal caregiver (mother) became exhausted from years of caregiving for difficult/narcissistic husband before any professional help arrived",
     "category": "caregiver-burnout", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "spouse",
     "source_text": "She's given up the last few years of her life having to take care of her husband, being exhausted and yelled at by him instead of traveling, making friends or doing fun things."},

    # 1rxk68g — dysphagia/starvation in dementia
    {"post_id": "1rxk68g", "pain_point": "Families not informed about dysphagia (swallowing dysfunction) as a terminal stage of dementia — watch loved ones starve over weeks without preparation",
     "category": "information-access", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "They do not think of starvation. The brain forgets how to swallow. This can take up to three weeks, while their family watches helplessly."},

    # 1pm3zju — 15 years of Parkinson's caregiving, sole caretaker 5 years
    {"post_id": "1pm3zju", "pain_point": "Sole family caretaker for 15-year degenerative disease with 6 weeks of hospital/SNF chaos at end — no respite, no relief, no coordination support",
     "category": "care-coordination", "track_relevance": "T1", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "I have been his lone caretaker for the last five years. The last month has been pure hell—in and out of hospitals and skilled nursing facilities for nearly six weeks before he passed."},

    # 1k3kwsc — validation technique for dementia agitation
    {"post_id": "1k3kwsc", "pain_point": "Families not taught validation/redirection techniques for dementia behavioral symptoms — default orientation approach worsens patient distress",
     "category": "dementia-behavioral-management", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "We used to try to gently remind her that her husband or parents had passed away. This was news every time, and she'd suddenly remember, and she'd be overcome with fresh grief."},
    {"post_id": "1k3kwsc", "pain_point": "Personalized reality-joining techniques for dementia patients must be discovered through trial and error by caregivers — no AI guidance available",
     "category": "dementia-behavioral-management", "track_relevance": "T1", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "family", "care_recipient": "parent",
     "source_text": "One day I just decided to play along and join her in HER reality. When I walked into her room I pretended that she had just arrived for a visit."},
]

# ── TRACK 2: Direct Care Workforce Pain Points ───────────────────────────────
t2_pain_points = [
    # 1gwpvru — false neglect claim from manipulative patient
    {"post_id": "1gwpvru", "pain_point": "CNAs have no protection from false patient accusations — no systematic documentation tools to prove care was delivered",
     "category": "worker-protection", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "He called his family and told them he had been neglected all day. He said he hadn't been changed since the night before and hadn't eaten anything either."},

    # 1kn0hw5 — quit toxic job, DON intimidation
    {"post_id": "1kn0hw5", "pain_point": "Management intimidation and favoritism drive CNA turnover — DON confrontational tactics with no HR protection or due process for workers",
     "category": "workforce-retention", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "DON and Admin pulled me into their office and tag teamed me for over 30 mins past my shift and didn't listen to a word I said when I tried to give my side of the story."},

    # 1ihaxs7 — nurse lied, only camera saved CNA
    {"post_id": "1ihaxs7", "pain_point": "CNAs rely on camera footage to prove innocence when nurses lie to protect their own licenses — no systematic documentation protects CNA accounts",
     "category": "worker-protection", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "A nurse attempted to lie on me to save her license. They found it on the cameras and saw for themselves how dismissive she was."},

    # 18e7xdh — patient weaponizing dependency
    {"post_id": "18e7xdh", "pain_point": "Patients weaponize dependency to demean CNAs with no policy or management support for setting limits on abusive behavior",
     "category": "workplace-safety", "track_relevance": "T2", "severity_score": 3,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I pay you to wipe my ass. Said to me by the man lying flat on his back with his hands clasped behind his head. He can do it. He really can. He just refuses."},

    # 1hc9sz1 — mass quit after Christmas party insult
    {"post_id": "1hc9sz1", "pain_point": "Employee recognition completely inadequate (hand sanitizer + parking spot for 5 years of work) — visible undervaluation triggers mass turnover",
     "category": "workforce-retention", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "She quit after getting hand sanitizer, free food from the kitchen for a week and just a parking spot. She worked there for 5 years with no complaints. A lot of CNAs agreed and quit one by one."},

    # 1685e4f — call light abuse, management won't act
    {"post_id": "1685e4f", "pain_point": "No tools to manage frequent-flier call light users equitably — management refuses to support CNAs in setting care boundaries, considering quitting over single resident",
     "category": "workflow-tools", "track_relevance": "T2", "severity_score": 3,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "She's hitting her call light every 3-5 minutes. I can't deal with this anymore, it's too much. I'm even considering quitting."},

    # 16ddu3a — written up despite ratio going to 14:1
    {"post_id": "16ddu3a", "pain_point": "CNAs written up for care lapses caused by facility-created impossible ratios (14:1) — no objective documentation system to record ratio and care delivery attempts",
     "category": "staffing-ratios", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "ratio went up to 10:1. Third night, 14:1. I was running around non-stop. She's written me up for neglecting and ignoring a patients needs."},

    # 1gtrjht — missed stroke, no baseline
    {"post_id": "1gtrjht", "pain_point": "No systematic neurological baseline tracking tools — CNAs miss critical deterioration changes (stroke) because prior shift did not document a baseline",
     "category": "clinical-tools", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "The charge nurse had to ask me if the patient was forming normal sentences when I last saw them. The nurse prior didn't give a baseline. There was no way of knowing how long the patient had been in that state."},
    {"post_id": "1gtrjht", "pain_point": "Shift handoff communication gaps create patient safety incidents — CNAs carry guilt for system-level failures caused by inadequate information transfer",
     "category": "shift-handoff", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I feel it was my responsibility because I should have checked on them a lot more frequently. The nurse prior didn't give a baseline."},

    # 177g51i — state report, 1:21 ratio, mandatory 16s
    {"post_id": "177g51i", "pain_point": "Mandatory ratio law (1:8) routinely violated — actual ratio 1:21 per hall — with no real-time tracking or anonymous reporting mechanism for CNAs",
     "category": "staffing-ratios", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "legislation says the ratio is supposed to be 1:8 during the day but most of the time this month it's been 1:21 (per hall) with a float"},
    {"post_id": "177g51i", "pain_point": "CNAs fear retaliation for reporting safety violations — no protected, truly anonymous reporting channel exists",
     "category": "worker-protection", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I'm low-key scared though. I had to leave my email for them to send it in, and it has my name in it. Supposedly it's anonymous but I'm still scared."},

    # 1akpupo — trach capped, patient died, 1:14 night shift
    {"post_id": "1akpupo", "pain_point": "Night shift CNA covering 14 ventilator patients alone (with one nurse) — non-standard care decisions (trach capping) not communicated between shifts, resulting in patient death",
     "category": "patient-safety", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "isolated", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "She coughed the cap off. They put the cap back on, left. The CNA came to change her at 6am and she was the color grey. She died at 6:15am."},

    # 1haearc — becoming CNA worst mistake
    {"post_id": "1haearc", "pain_point": "Chronic physical toll of CNA work (muscle pain, back injury) with no recovery time between shifts — physically unsustainable work conditions causing attrition",
     "category": "workforce-retention", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I'm tired of the impossible CNA to patient ratio. I'm tired of not having a single second of downtime on my shifts. Work without any downtime is not sustainable."},
    {"post_id": "1haearc", "pain_point": "Residents and families permitted to verbally harass CNAs with no consequences — unlike all other workplaces where harassment is illegal",
     "category": "workplace-safety", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "Everywhere else you go it will be illegal and you will get kicked out for harassing and insulting someone but not nursing homes."},

    # 1eadj7d — not allowed to sit for charting
    {"post_id": "1eadj7d", "pain_point": "CNAs forced to chart at standing wall kiosks while nurses use desk computers — documentation infrastructure signals and enforces second-class status",
     "category": "documentation-tools", "track_relevance": "T2", "severity_score": 3,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "There are kiosks mounted on the wall specifically for the CNAs. The kiosks on the wall make your arm hurt and your feet are already killing you after a long shift."},

    # 1ij5j9x — ED trauma, no mental health support
    {"post_id": "1ij5j9x", "pain_point": "CNAs exposed to severe psychological trauma (violent deaths, post-mortem care) without mental health support or preparation",
     "category": "worker-mental-health", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I thought I was ready. I wasn't. I've been working in the Emergency Department for about four weeks now and feel like this community might understand what I'm going through."},

    # 1eoj7gi — nurses treat CNAs as slaves
    {"post_id": "1eoj7gi", "pain_point": "Nursing hierarchy treats CNAs as subordinate labor — assigned nurse tasks, disrespected, and given 8-10 patient loads with half being total care",
     "category": "workplace-culture", "track_relevance": "T2", "severity_score": 4,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "A LOT of nurses treat you like crap, treat you like the bottom of the food chain. They sometimes treat you like their personal slave. The work load is HEAVY literally."},

    # 1kr5i07 — $16.50 offered, experienced CNA refusing
    {"post_id": "1kr5i07", "pain_point": "Experienced CNAs offered $16.50/hr by facilities — below private duty market rate ($21+/hr) — driving shortage as workers exit to higher-paying private arrangements",
     "category": "compensation", "track_relevance": "T2", "severity_score": 5,
     "frequency_indicator": "common", "caregiver_type": "paid_direct_care", "care_recipient": "elder",
     "source_text": "I really wonder why do they think an experienced CNA is going to work for Pennies at a nursing home. I've been a CNA for going on three years and always made a minimum of $20/hr."},
]

# ── QUOTES ────────────────────────────────────────────────────────────────────
quotes = [
    {"post_id": "1s1ggmt", "track_relevance": "T1", "theme": "caregiver-life-impact", "quality_score": 5,
     "quote": "I used to think I might get my life back, but I've found that you don't. You can't get back all the lost social and career opportunities. You don't get your mental and physical health back.",
     "context": "Adult son reflecting after mother's death from dementia, on why caregiving NPR stories are misleading"},
    {"post_id": "17bdc1v", "track_relevance": "T1", "theme": "moral-distress", "quality_score": 5,
     "quote": "I'm 25 years old. How is it fair to the caregivers that have to throw away their entire lives until the person finally expires from some other cause God only knows when, only to be left with the trauma of everything they had to do?",
     "context": "Young adult dementia caregiver expressing rage at lack of end-of-life options and caregiver support"},
    {"post_id": "1lhgt7k", "track_relevance": "T1", "theme": "pain-management", "quality_score": 5,
     "quote": "I watched my no-longer-verbal dad cry out as nurses had to change him, the pain untouched by the hospice morphine. I watched him sob at the grandkids he missed.",
     "context": "Adult child describing final days of father in hospice care after 5 years as sole caregiver"},
    {"post_id": "1rxk68g", "track_relevance": "T1", "theme": "dementia-education", "quality_score": 5,
     "quote": "They do not think of starvation. The brain forgets how to swallow. This is not a metaphor. This can take up to three weeks, while their family watches helplessly.",
     "context": "Post written to inform other caregivers what end-stage dementia actually involves — swallowing dysfunction"},
    {"post_id": "1me2v0v", "track_relevance": "T1", "theme": "caregiver-guilt", "quality_score": 5,
     "quote": "I find I wish my mother was no longer here and suffering. Please tell me I am not the only terrible person out there.",
     "context": "Family caregiver watching mother's dementia-caused personality transformation, expressing taboo guilt"},
    {"post_id": "1iv9b2x", "track_relevance": "T1", "theme": "system-navigation", "quality_score": 4,
     "quote": "Constantly trying to re-assess their continually failing abilities and what they need next, learning about the levels of care — the ground constantly shifting underfoot.",
     "context": "Family navigating parents' care across 3 states over 12 months of acute decline"},
    {"post_id": "16ddu3a", "track_relevance": "T2", "theme": "staffing-ratios", "quality_score": 5,
     "quote": "Ratio went up to 10:1. Third night, 14:1. I was running around non-stop. She's written me up for neglecting and ignoring a patient's needs.",
     "context": "CNA written up for care lapses directly caused by facility-imposed impossible ratios"},
    {"post_id": "177g51i", "track_relevance": "T2", "theme": "regulatory-violation", "quality_score": 5,
     "quote": "Legislation says the ratio is supposed to be 1:8 during the day but most of the time this month it's been 1:21 per hall with a float.",
     "context": "CNA who reported their nursing home to the state for chronic ratio violations"},
    {"post_id": "1haearc", "track_relevance": "T2", "theme": "workforce-sustainability", "quality_score": 5,
     "quote": "I'm tired of the impossible CNA to patient ratio. I'm tired of not having a single second of downtime on my shifts. Work without any downtime is not sustainable.",
     "context": "CNA with borderline personality disorder describing physical and mental collapse from working conditions"},
    {"post_id": "1kr5i07", "track_relevance": "T2", "theme": "compensation", "quality_score": 5,
     "quote": "I really wonder why they think an experienced CNA is going to work for pennies at a nursing home. This is why there is a shortage and nobody wants to work.",
     "context": "Experienced CNA who ended a phone interview immediately when told $16.50/hr rate"},
    {"post_id": "1hc9sz1", "track_relevance": "T2", "theme": "workforce-retention", "quality_score": 4,
     "quote": "She quit after getting hand sanitizer, free food from the kitchen for a week and just a parking spot. She worked there for 5 years with no complaints.",
     "context": "Mass quit triggered after employee of the month recognition was seen as insulting"},
    {"post_id": "1gtrjht", "track_relevance": "T2", "theme": "shift-handoff", "quality_score": 4,
     "quote": "The nurse prior didn't give a baseline. There was no way of knowing how long the patient had been in that state.",
     "context": "CNA who may have missed a stroke because prior shift left no neurological baseline in the handoff"},
    {"post_id": "1k3kwsc", "track_relevance": "T1", "theme": "dementia-behavioral-management", "quality_score": 5,
     "quote": "We used to try to gently remind her that her husband or parents had passed away. This was news every time, and she'd suddenly remember, and she'd be overcome with fresh grief. We made everything so much worse.",
     "context": "Family caregiver who discovered validation technique after years of harmful reality-orientation attempts"},
]

# Write everything
pp_count = write_pain_points(conn, t1_pain_points + t2_pain_points)
q_count = write_quotes(conn, quotes)
print(f"Written: {pp_count} pain points, {q_count} quotes")
print(db_summary(conn))
