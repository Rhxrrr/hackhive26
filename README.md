## 🎧 Overview

**QAI** is an AI-first customer service quality assurance platform that understands conversations—not just transcripts. Upload or stream a customer service call and watch QAI automatically surface the moments that matter most. No more scrubbing through hours of audio, no more subjective scoring—QAI listens alongside your quality team and turns conversations into actionable insights.

> *“Show me where the customer became frustrated and how the agent handled it.”*.

QAI analyzes both **what is said** and **how it’s said**, detecting tone shifts, empathy gaps, and resolution moments in real time or post-call. It aligns directly with your company’s QA rubric to generate explainable scores, detailed reports, and coaching-ready feedback.

---

## ✨ Why QAI?

- **Conversation-Aware QA** — Automatically detect **good**, **bad**, **uncertain**, and **needs improvement** moments throughout a call  
- **Tone & Sentiment Detection** — Track emotional drift like frustration, hesitation, and relief as conversations unfold  
- **Interactive Audio Timeline** — Jump directly to key moments instead of listening end-to-end  
- **Rubric-Based Scoring** — Score agents using your company’s existing QA marking scheme  
- **Real-Time Agent Coaching** — Surface live suggestions on empathy, tone, and sales techniques during active calls  
- **Explainable Reports** — Every score is backed by transcript evidence and timestamps  
- **Built for Quality Coaches** — Reduce manual review time by **50–70%** while reviewing more calls with greater consistency  

---

QAI turns quality assurance from a manual, reactive process into a **fast, consistent, and coach-driven workflow**—helping teams improve agent performance and customer experience at scale.

## 🚀 Features

### 🎙️ AI-Powered Tools

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

## 🛠️ Tech Stack

### 🎨 Frontend
- **Next.js** — Application framework for fast, scalable web experiences  
- **React** — Interactive UI for timelines, transcripts, and QA dashboards  
- **TypeScript** — Type-safe data models for QA outputs and API contracts  
- **Tailwind CSS** — Modern, responsive styling with consistent design  

---

### 🧠 AI & APIs
- **OpenAI API** — Contextual analysis for tone detection, QA classification, scoring, and coaching insights  
- **Soniox API** — Real-time and batch speech-to-text with speaker separation and timestamps  

---

### ⚙️ Backend & Services
- **Node.js / Express** — Core backend for audio ingestion, QA orchestration, and API endpoints  

## ⚡ Quick Start

### ✅ Prerequisites
Make sure you have the following installed and set up:

- **Node.js 18+**
- **npm** or **pnpm**
- **OpenAI API key** (used for analysis, tone detection, coaching, and live feedback)
- **Soniox account** (used for real-time and batch transcription)  
  👉 Get a key at: https://console.soniox.com

---

## 📦 Installation
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

# npm run dev

```
---

👉 http://localhost:3000

## 📁 Project Structure
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
## ⚠️  Challenges we ran into

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


## 🙏 Acknowledgements

- **OpenAI** — Tone detection, contextual analysis, QA scoring, and live coaching insights  
- **Soniox** — Real-time and batch speech-to-text transcription with speaker separation

---

## 📬 Contact

**Team:**
- Abinan Suthakaran
- Adam Marcelo
- Jordan Earle
- Hamzah Al-Hamadani



