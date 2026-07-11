# Prototype Build & Deploy Handoff
## ACL Caregiver AI Challenge — Dementia Coach + CNA Shield
**For the Claude session with Vercel MCP access**

---

## Context

We are building two grant submission prototypes for the ACL Caregiver AI Challenge (deadline July 31, 2026). Each prototype needs a live Vercel URL that gets inserted into the application documents. The grant applications are in:

- `applications/track1_dementia_coach/dementia_coach_application.md`
- `applications/track2_cna_shield/cna_shield_application.md`

The prototype URL placeholder reads: `[PROTOTYPE URL — to be added prior to submission]`

Once deployed, replace that placeholder in both the application and the cover sheet of the relevant application.

**Build Dementia Coach first** — it is the stronger demo and the one reviewers will find most compelling.

---

## Critical First Step: Node Version

Node 14.17.3 is installed. Next.js 14 requires Node 18+.

**Before doing anything else:**
```bash
# Check current version
node --version

# If still 14, install Node 20 LTS from nodejs.org
# OR if nvm-windows is available:
nvm install 20
nvm use 20
```

Verify: `node --version` should show v20.x.x before proceeding.

---

## Vercel MCP — Available Tools

The Vercel MCP is connected at `https://mcp.vercel.com`. After authentication, these are the tools available:

| Tool | What it does |
|------|-------------|
| `deploy_to_vercel` | Deploys the current project directory to Vercel — no params needed |
| `use_vercel_cli` | Instructs use of Vercel CLI commands (requires `action` param) |
| `list_teams` | Lists Vercel teams for the authenticated account |
| `list_projects` | Lists all Vercel projects (requires `teamId`) |
| `get_project` | Gets project details including domains (requires `projectId`, `teamId`) |
| `list_deployments` | Lists deployments for a project |
| `get_deployment` | Gets deployment details including URL |
| `get_deployment_build_logs` | Gets build logs — use this to debug failures |
| `get_runtime_logs` | Gets runtime logs for debugging |
| `web_fetch_vercel_url` | Fetches a protected Vercel URL with auth |

**Deployment workflow:**
1. Build the Next.js app in `prototypes/dementia-coach/`
2. `cd` into that directory
3. Call `deploy_to_vercel` — Vercel MCP deploys it and returns the URL
4. If build fails, call `get_deployment_build_logs` to debug

---

## Prototype 1: Dementia Coach

### Purpose
Show a grant reviewer — in 2 minutes — exactly what Dementia Coach does. The demo should be emotionally legible to a non-technical reader.

### Scaffold location
```
prototypes/dementia-coach/
```

### Stack
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Anthropic SDK** (`@anthropic-ai/sdk`) — for live AI script generation
- No database. Margaret's profile is hardcoded. API key via environment variable.

### Environment variable needed
```
ANTHROPIC_API_KEY=<Aidan's Anthropic API key>
```
Set this in Vercel dashboard after first deploy, or via `vercel env add ANTHROPIC_API_KEY`.

### Pages

#### `/` — Landing / The Moment
The opening scenario from the application document, made visual.

**Layout:**
```
[Header: Dementia Coach logo + tagline]

--- BEFORE ---
[Dark/warm card]
It is 9:17 p.m. Carol's mother Margaret is standing in the hallway
with her coat on, convinced she needs to pick up her children from school.

"Mom, your kids are grown. They're in their forties. You're home."

Margaret's face collapses. The panic escalates.
Carol has been having this conversation, this exact way, for eight months.

[Button: → See what Dementia Coach does instead]

--- AFTER (revealed on button click or scroll) ---
[Bright card]
Carol opens the app. She types: "Mom thinks she needs to pick up her 
kids from school. Very agitated, has her coat on."

[Show the 3 script cards animating in]
[Button: → Try it yourself]
```

#### `/demo` — Interactive Coaching Demo
The core product experience. Margaret's profile is pre-loaded.

**Layout:**
```
[Left panel — Margaret's Profile Card]
  Photo placeholder (elder woman icon)
  Name: Margaret
  Age: 79 | Stage: Mid-stage Alzheimer's
  
  Who she was:
  • Retired schoolteacher, 35 years
  • Loved gardening (roses especially)
  • Always the one who "held everything together"
  • Husband: Robert, passed 2019
  • Children: two daughters, both in their 40s
  • Calmed by: kitchen activity, talking about her garden
  • Agitated by: being told she's wrong, loud noises

[Right panel — Coaching Interface]
  [Text area]: "Describe what's happening right now..."
  
  [Preset scenario buttons]:
  • "She thinks she needs to pick up her kids from school"
  • "She's asking where Robert is"  
  • "She's refusing to take her bath"
  • "She's very agitated and wants to 'go home'"
  
  [Generate Scripts button]
  
  [3 Script cards — appear after generation]:
  Each card shows:
    - Technique label (e.g., "Reminiscence")
    - The script text (personalized to Margaret)
    - One-line explanation of why it works
    - [Use this] button (copies to clipboard)
```

**API route:** `app/api/coach/route.ts`

Takes: `{ situation: string, profile: MargareProfile }`
Calls: Claude API with system prompt containing validation therapy principles + Margaret's profile
Returns: 3 script objects `{ technique, script, explanation }`

**Claude system prompt for the API route:**
```
You are Dementia Coach, an AI that helps family caregivers handle difficult 
moments using validation therapy — joining the person's emotional reality 
rather than correcting their factual beliefs.

The care recipient is Margaret:
- Retired schoolteacher, 35 years
- Loves roses and gardening
- Always needed to feel useful and in control
- Husband Robert passed away in 2019
- Has two daughters in their 40s
- Calmed by kitchen activity, talking about her garden
- Agitated by being told she's wrong

Generate exactly 3 response options for the caregiver. Each should:
1. Be grounded in validation therapy (join, don't correct)
2. Reference Margaret's specific history and identity
3. Be something a non-professional caregiver could say naturally

Return as JSON array: [{ technique, script, explanation }]
Techniques to draw from: Validation, Reminiscence, Identity Affirmation, 
Gentle Redirection, Joining Her Reality
```

### Visual design direction
- Warm, calm color palette — soft cream/warm white background, sage green accents
- Large readable text (caregivers are often 50+)
- Mobile-first layout (caregivers use phones)
- No clinical coldness — this should feel like a trusted friend, not a medical tool
- The 3 script cards should feel like they're being gently handed to you

### Key UX details
- Preset scenario buttons make it immediately interactive without typing
- Scripts generate in ~3 seconds — show a gentle loading state ("Finding the right words...")
- Each script card has a soft animation entrance (stagger the 3 cards)
- "Use this" button copies to clipboard with a ✓ confirmation

---

## Prototype 2: CNA Shield

### Purpose
Show that voice-first documentation is real and accessible. Simpler demo — the audience is workforce policy people, not tech reviewers.

### Scaffold location
```
prototypes/cna-shield/
```

### Stack
- Next.js 14, Tailwind CSS
- No AI API needed for the demo — simulate the voice-to-text output
- Optional: use Web Speech API (browser built-in) for real voice input on supported browsers

### Pages

#### `/` — Landing / Marcus's Shift
Same structure as Dementia Coach — before/after scenario with Marcus.

#### `/demo` — Shift Demo
```
[Top bar]: Shift Timer: 7h 42m | Residents: 14 | Ratio: 1:14 ⚠️

[Voice Log Feed — left/main panel]:
  [Big mic button]: "Tap to log care"
  
  [Log entries appearing below]:
  ✓ 10:14pm — Room 306: Repositioned to right side, incontinence care complete
  ✓ 10:31pm — Room 312: Resident appears more confused than baseline, noted
  ✓ 10:45pm — Room 308: Vitals — BP 142/88, elevated, flagged
  ✓ 11:02pm — Room 301: Mr. Davis — BP 156/94, second elevated reading

[Right panel — Shift Handoff Preview]:
  "Your handoff summary — ready at shift end"
  
  🔴 URGENT: Mr. Davis (301) — BP elevated twice this shift (142/88, 156/94)
  ⚠️  WATCH: Room 312 — confusion above baseline, monitor
  ✓  14 residents, all checked
  
  [Generate Full Handoff button]

[Bottom bar]:
  Ratio logged: 1:14 | Legal limit: 1:8 | [Submit to state registry]
```

**Simulation approach:** 
- Mic button triggers a simulated 3-second "listening" state
- Then adds a pre-written care log entry (cycle through preset entries)
- If browser supports Web Speech API, use real transcription instead
- Shift handoff panel updates live as entries are added

### Visual design direction
- Clinical but approachable — navy/white with alert colors (red, amber, green)
- Designed to look like it works on a phone held in one hand
- The ratio display should make the 1:14 vs 1:8 gap visually obvious

---

## Deployment Steps

### Dementia Coach
```bash
# 1. Scaffold
cd prototypes/
npx create-next-app@latest dementia-coach --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes

# 2. Install Anthropic SDK
cd dementia-coach
npm install @anthropic-ai/sdk

# 3. Build the pages (see design above)

# 4. Deploy via Vercel MCP
# Call deploy_to_vercel tool — it deploys from the current directory

# 5. Add environment variable
# vercel env add ANTHROPIC_API_KEY
# (or set in Vercel dashboard)

# 6. Redeploy after env var is set
# Call deploy_to_vercel again
```

### CNA Shield
Same process, no API key needed.

---

## After Deployment: Update Application Documents

Once each prototype has a live URL, update these exact placeholders in **three places per application**:

**Dementia Coach — replace all three instances of:**
```
[PROTOTYPE URL — to be added prior to submission]
```
**In:**
- `applications/track1_dementia_coach/dementia_coach_application.md` (appears at top and in Abstract)
- `applications/track1_dementia_coach/dementia_coach_cover_sheet.md`

**CNA Shield — same pattern:**
- `applications/track2_cna_shield/cna_shield_application.md`
- `applications/track2_cna_shield/cna_shield_cover_sheet.md`

---

## File Structure (target)
```
prototypes/
├── PROTOTYPE_HANDOFF.md          ← this document
├── dementia-coach/               ← Next.js app
│   ├── app/
│   │   ├── page.tsx              ← landing / before-after
│   │   ├── demo/
│   │   │   └── page.tsx          ← interactive coaching demo
│   │   ├── api/
│   │   │   └── coach/
│   │   │       └── route.ts      ← Claude API call
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ProfileCard.tsx
│   │   ├── ScriptCard.tsx
│   │   ├── ScenarioButtons.tsx
│   │   └── CoachingInterface.tsx
│   ├── package.json
│   └── tailwind.config.ts
└── cna-shield/                   ← Next.js app (build second)
    └── ...
```

---

## What Success Looks Like

A grant reviewer opens the Dementia Coach URL and within 60 seconds:
1. Reads the Carol/Margaret scenario and understands the problem
2. Clicks a preset scenario ("She's asking where Robert is")
3. Watches 3 personalized, warm, specific scripts appear
4. Understands immediately: *this is not generic advice — it knows Margaret*

That's the demo. Everything else is secondary.
