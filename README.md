<p align="center">
  <img src="public/qai-logo.png" alt="QAI Logo" width="220" />
</p>

## ~~ What is QAI? ~~

**QAI** is an AI-powered evaluation platform that automates the analysis of customer experience quality assurance conversations using personalized, dynamic metrics. By streaming or uploading calls, QAI identifies "moments that matter" in real-time, eliminating manual scrubbing and subjective scoring.

Acting as an intelligent co-pilot, QAI listens alongside your team to provide:
- Live Agent Support: Instant, optimal solutions for handling distressed customers.
- Automated Grading: Real-time call evaluations based on your specific QA rubric.
- Manager Command Center: A comprehensive suite of tools for monitoring, logging, and coaching agents at scale.
---

## ~~ Why QAI? ~~
- QAI can 10x the amount of calls a manager can analyze. 
- Currently, Only 1-4% of calls are analyzed.
- 80% of customers consider the experience a company provides as important as its product and services.
- 80% of customer service organization are expected to make the jump for AI tools by 2026.
- 54% of consumers believe that customer experience at most companys need major improvements.
---

QAI turns quality assurance from a manual, reactive process into a **fast, consistent, and coach-driven workflow**—helping teams improve agent performance and customer experience at scale.

## ~~ Features ~~
| Feature | Description |
|------|-------------|
| **Conversation-Aware QA** | Analyze full customer service calls and automatically detect **good**, **bad**, **uncertain**, and **needs improvement** moments across the conversation |
| **Tone & Sentiment Detection** | Track emotional changes such as frustration, hesitation, and relief in real time or post-call using voice and language signals |
| **Interactive Audio Timeline** | Visual timeline with markers that let quality coaches jump directly to key moments instead of listening end-to-end |
| **Speaker-Labeled Transcripts** | Separate agent and customer dialogue with timestamps for faster review and context |
| **Rubric-Based Scoring** | Score agent performance using the company’s custom QA rubric and marking scheme |
| **Explainable QA Reports** | Generate detailed QA reports with scores, transcript evidence, and timestamps to support consistent evaluations |
| **Real-Time Agent Coaching** | Surface live suggestions during calls to improve tone, empathy, and objection handling |
| **Sales Guidance & Techniques** | Provide contextual sales tips and conversation strategies based on what the customer is saying |
| **Synthetic Call Generator** | Create realistic AI-generated customer service calls with emotional progression for testing and demos |
| **Scalable QA Workflow** | Review more calls in less time while maintaining consistency across reviewers |

## ~~ Tech Stack ~~
### Frontend
- **Next.js** — Application framework for fast, scalable web experiences  
- **React** — Interactive UI for timelines, transcripts, and QA dashboards  
- **TypeScript** — Type-safe data models for QA outputs and API contracts  
- **Tailwind CSS** — Modern, responsive styling with consistent design
- 
### AI & APIs
- **OpenAI API** — Contextual analysis for tone detection, QA classification, scoring, and coaching insights  
- **Soniox API** — Real-time and batch speech-to-text with speaker separation and timestamps  

### Backend & Services
- **Node.js / Express** — Core backend for audio ingestion, QA orchestration, and API endpoints  

---
## ~~ Quick Start ~~
### Prerequisites:
Make sure you have the following installed and set up:
- **Node.js 18+**
- **npm** or **pnpm**
- **OpenAI API key** (used for analysis, tone detection, coaching, and live feedback)
- **Soniox account** (used for real-time and batch transcription)
 Get a key at: https://console.soniox.com

---
## ~~ Installation ~~
```bash
# Navigate to the project directory
cd hackhive26

# Install dependencies
npm install
```
---

## Environment Variables
Create a .env.local file in the project root and add the following variables:
```bash
# AI / Transcription
OPENAI_API_KEY=your_openai_key
SONIOX_API_KEY=your_soniox_key
```

---

## Run Development Server

```bash

npm run dev

```
---

-->> http://localhost:3000

## ~~ Project Structure ~~
```bash

hackhive26/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── analyze/          # AI analysis endpoints
│   │   ├── transcribe/       # Audio transcription
│   │   └── soniox/           # Soniox (tone, coaching, live feedback)
│   ├── analytics/            # Analytics page
│   ├── dashboard/            # Dashboard page
│   ├── live/                 # Live call page
│   ├── live-call/            # Live call page (alternate route)
│   ├── qa/                   # QA review page
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/               # Reusable React components
│   ├── ui/                   # shadcn/ui components
│   ├── analysis-panel.tsx    # Analysis panel
│   ├── app-sidebar.tsx       # App sidebar
│   ├── upload-zone.tsx       # Upload zone
│   ├── waveform-timeline.tsx # Waveform timeline
│   └── theme-provider.tsx    # Theme provider
│
├── hooks/                    # Custom React hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/                      # Utilities & helpers
│   └── utils.ts              # Helper functions
│
├── public/                   # Static assets
│
└── styles/                   # Stylesheets
    └── globals.css


```
---
## ~~ Challenges we ran into ~~

- Inconsistent QA interpretations during subtle tone shifts  
- Overconfident classifications in ambiguous or low-confidence moments  
- Emotional tone changes gradually across conversations, making single-utterance analysis unreliable  
- Latency when running real-time transcription and QA analysis simultaneously  
- Heavy scoring logic not suitable for live call processing  
- Merge conflicts caused by rapid prompt and UI iteration  
- Inconsistent behavior across branches during experimentation  
- Early QA outputs felt like a black box for quality coaches  
- Difficulty validating AI decisions without emphasizing explainability

--- 


## ~~ Acknowledgements ~~

- **OpenAI** — Tone detection, contextual analysis, QA scoring, and live coaching insights  
- **Soniox** — Real-time and batch speech-to-text transcription with speaker separation

---

## ~~ Contact ~~

**Team:**
- Abinan Suthakaran
- Adam Marcelo
- Jordan Earle
- Hamzah Al-Hamadani

