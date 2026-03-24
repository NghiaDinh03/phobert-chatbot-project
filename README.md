<div align="center">
  <h1>🛡️ CyberAI Assessment Platform v2.0</h1>
  <p>Enterprise ISO 27001 Assessment · RAG Chatbot · AI News Aggregator · Text-to-Speech</p>
  <p>
    <a href="README.md"><img src="https://img.shields.io/badge/English-README-blue?logo=googletranslate&logoColor=white" /></a>
    <a href="README_vi.md"><img src="https://img.shields.io/badge/Tiếng Việt-README-red?logo=googletranslate&logoColor=white" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" />
    <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" />
    <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-orange" />
  </p>
</div>

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Feature Mechanism Flows](#feature-mechanism-flows)
  - [AI Chatbot (RAG)](#1-ai-chatbot-rag-flow)
  - [ISO 27001 Assessment](#2-iso-27001-assessment-flow)
  - [News Aggregator + TTS](#3-news-aggregator--text-to-speech-flow)
  - [Analytics Dashboard](#4-analytics-dashboard-flow)
- [Tech Stack](#tech-stack)
- [AI Models](#ai-models)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Performance](#performance)

---

## Overview

**CyberAI Assessment Platform** is a fully containerized, on-premise AI system designed for Vietnamese enterprises. It combines:

- **ISO 27001:2022 & TCVN 11930:2017 compliance assessment** — automated gap analysis powered by a dual-LLM pipeline
- **RAG-powered AI Chatbot** — retrieves knowledge from your own ISO/law documents via ChromaDB and answers with source attribution
- **AI News Aggregator** — fetches cybersecurity and financial RSS feeds, translates to Vietnamese, and generates audio summaries via Edge-TTS
- **System Analytics Dashboard** — real-time monitoring of AI services, cache usage, vector store health, and assessment history

The entire system runs via a single `docker-compose up` command with no manual dependency setup required.

---

## System Architecture

### Container Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                       phobert-network (bridge)                  │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────┐  │
│  │  phobert-frontend│    │  phobert-backend │    │phobert-   │  │
│  │  (Next.js 15)    │◄──►│  (FastAPI)       │◄──►│localai    │  │
│  │  Port: 3000      │    │  Port: 8000      │    │Port: 8080 │  │
│  └──────────────────┘    └────────┬─────────┘    └───────────┘  │
│                                   │                              │
│                          ┌────────▼─────────┐                   │
│                          │   /data (Volume)  │                   │
│                          │  ├─ vector_store/ │                   │
│                          │  ├─ summaries/    │                   │
│                          │  ├─ sessions/     │                   │
│                          │  ├─ iso_documents/│                   │
│                          │  └─ translations/ │                   │
│                          └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### Request Routing

- **Frontend → Backend**: All `/api/*` calls are transparently proxied via `next.config.js` rewrites rule:
  ```
  /api/:path*  →  http://backend:8000/api/:path*
  ```
  No CORS issues; the frontend never calls the backend directly from the browser.

- **Backend → Cloud AI**: `CloudLLMService` routes to **Open Claude** (primary), **OpenRouter** (secondary), **LocalAI** (final fallback) using a multi-key round-robin scheduler with 60s per-key cooldown on HTTP 429.

- **Backend → LocalAI**: Via `http://localai:8080/v1/chat/completions` (OpenAI-compatible API). LocalAI hot-loads GGUF models on first request.

---

## Feature Mechanism Flows

### 1. AI Chatbot (RAG) Flow

```
User types question
        │
        ▼
[Frontend: /chatbot]
POST /api/chat  ──►  [Backend: chat_service.py]
                              │
                    ┌─────────▼──────────┐
                    │ 1. Session Memory   │
                    │  Load last 20 msgs  │
                    │  from sessions/     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ 2. Route Detection  │
                    │  model_router.py    │
                    │  7 categories:      │
                    │  iso/security/legal │
                    │  /tech/news/general │
                    │  /greeting          │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ 3. RAG Retrieval    │
                    │  Embed question     │
                    │  all-MiniLM-L6-v2  │
                    │  Query ChromaDB     │
                    │  Top-3 chunks by    │
                    │  Cosine Similarity  │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ 4. Cloud LLM Call   │
                    │  Open Claude (1st)  │
                    │  OpenRouter (2nd)   │
                    │  LocalAI (fallback) │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ 5. Save + Respond   │
                    │  Append to session  │
                    │  Stream response    │
                    │  to frontend        │
                    └────────────────────┘
                              │
                              ▼
                   Answer with source attribution
                   displayed in chat UI
```

**Key components:**
- [`backend/services/chat_service.py`](backend/services/chat_service.py) — orchestrates session memory, routing, RAG, and LLM calls
- [`backend/services/rag_service.py`](backend/services/rag_service.py) — vector retrieval with multi-query search
- [`backend/services/cloud_llm_service.py`](backend/services/cloud_llm_service.py) — multi-provider LLM client
- [`frontend-next/src/app/chatbot/page.js`](frontend-next/src/app/chatbot/page.js) — streaming chat UI with session sidebar

---

### 2. ISO 27001 Assessment Flow

```
User fills assessment form
(industry, infrastructure, policies)
        │
        ▼
[Frontend: /form-iso]
  Step 1: Select standard (ISO 27001 / TCVN 11930)
  Step 2: Infrastructure details
  Step 3: Policy checkboxes (93 controls)
        │
        ▼
POST /api/iso27001/assess
        │
        ▼
[Backend: iso27001_service.py]
        │
        ├──► Phase 1: RAG Context Retrieval
        │     Query ChromaDB with assessment data
        │     Retrieve relevant ISO/TCVN document chunks
        │
        ├──► Phase 2: Gap Analysis (SecurityLLM / Cloud LLM)
        │     Receives: form JSON + RAG context
        │     Outputs: raw list of gaps, risks, violations
        │     Format: bullet points, severity levels
        │
        └──► Phase 3: Report Generation (Cloud LLM / Llama)
              Receives: gap analysis from Phase 2
              Role: "Expert report writer"
              Outputs: structured Vietnamese markdown report
              Includes: risk level, action plan, ISO references
        │
        ▼
Response: { risk_level, report_markdown, controls_analyzed }
        │
        ▼
[Frontend: displays report]
  Risk level badge (Critical/High/Medium/Low)
  Markdown report with action plan
  Save to data/assessments/ for history
```

**Key components:**
- [`backend/api/routes/iso27001.py`](backend/api/routes/iso27001.py) — assessment endpoints
- [`frontend-next/src/app/form-iso/page.js`](frontend-next/src/app/form-iso/page.js) — multi-step form UI
- [`frontend-next/src/data/standards.js`](frontend-next/src/data/standards.js) — ISO/TCVN control definitions
- [`data/knowledge_base/iso27001.json`](data/knowledge_base/iso27001.json) — 93 control definitions

---

### 3. News Aggregator + Text-to-Speech Flow

#### Background Flow (Auto, every cycle)
```
[Background Worker: news_service.py]
        │
        ▼
┌───────────────────────────────────────────────────┐
│ RSS Feed Fetch                                    │
│  • Cybersecurity: The Hacker News, BleepingComp  │
│  • Stocks (International): CNBC, Yahoo Finance   │
│  • Stocks (Vietnam): CafeF, VnEconomy            │
│  feedparser library → 15–20 articles/category    │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Title Translation (Background Thread)             │
│  VinAI Translate (135M params, CPU-only)          │
│  EN → VI for international articles               │
│  Batch: 8 titles per call (OOM prevention)        │
│  Cache: data/translations/<category>.json         │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Article Tagging (Background Thread)               │
│  CloudLLMService → short prompt:                  │
│  "Tag 1-2 keywords. No explanation."              │
│  Tags: Ransomware, Pháp lý, Zero-Day, Cổ tức...  │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
             Results served via
          GET /api/news?category=...
```

#### On-Demand Flow (User clicks 🔊 Play)
```
[User clicks Play on article]
        │
        ▼
[Frontend: togglePlay() in news/page.js]
  Check client-side audioData state
        │
   cached? ──YES──► play existing Audio()
        │
       NO
        │
        ▼
POST /api/news/summarize { url, title, lang }
        │
        ▼
[Backend: summary_service.py]
        │
        ▼
┌───────────────────────────────────────────────────┐
│ Step 1: Cache Check                               │
│  MD5(url) → check data/summaries/<hash>.json      │
│  If hit → return cached audio_url + summary_vi    │
└───────────────────┬───────────────────────────────┘
                    │ Cache miss
                    ▼
┌───────────────────────────────────────────────────┐
│ Step 2: Article Scraping (3-method fallback)      │
│  1. requests + BeautifulSoup4 (primary)           │
│  2. trafilatura (fallback)                        │
│  3. newspaper3k (last resort)                     │
│  Noise filtering, deduplication, 12000 char cap   │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Step 3: AI Translation + Editorial Rewrite        │
│  CloudLLMService 3-tier fallback:                 │
│  1. Open Claude (gemini-3-pro-preview)            │
│     Multi-key round-robin, 60s cooldown on 429    │
│  2. OpenRouter (if all Cloud keys fail)           │
│  3. LocalAI / Llama 3.1 (offline fallback)        │
│  Prompt: full editorial rewrite in Vietnamese     │
│  Preserves: CVEs, dates, names, stats verbatim    │
│  max_tokens: 16000                                │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Step 4: Pronunciation Fix                         │
│  _fix_pronunciation(): DDoS→"Đi Đốt", VPN, SSL   │
│  TLS, ransomware, blockchain → readable VI terms  │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Step 5: Text-to-Speech (Edge-TTS)                 │
│  Microsoft Edge-TTS, voice: vi-VN-HoaiMyNeural   │
│  Output: data/summaries/audio/<hash>.mp3          │
│  Hash = MD5(url)                                  │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ Step 6: Persist Cache                             │
│  data/summaries/<hash>.json                       │
│  { summary_vi, audio_url, created_at, retryable } │
│  TTL: 7 days → auto-cleaned by background worker  │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
[Frontend receives { audio_url, summary_vi }]
  Creates Audio() object → plays MP3 stream
  Shows Vietnamese summary below article card
  History sidebar updated with cached entry
```

**Key components:**
- [`backend/services/summary_service.py`](backend/services/summary_service.py) — scraping, translation, TTS, caching
- [`backend/services/news_service.py`](backend/services/news_service.py) — RSS fetching, background workers
- [`backend/services/cloud_llm_service.py`](backend/services/cloud_llm_service.py) — 3-tier AI fallback
- [`frontend-next/src/app/news/page.js`](frontend-next/src/app/news/page.js) — news UI with audio player

---

### 4. Analytics Dashboard Flow

```
[Frontend: /analytics]
        │
        ├──► Poll every 5s: GET /api/system/stats
        │     CPU usage, RAM usage, disk usage
        │     Rendered by SystemStats.js component
        │
        ├──► On load: GET /api/iso27001/history
        │     List all past assessments
        │     Columns: date, standard, risk level
        │     Actions: view report, delete, reuse form data
        │
        ├──► On load: GET /api/system/cache-stats
        │     Count of translation JSON files
        │     Count of summary JSON + audio MP3 files
        │     Total disk usage (MB)
        │
        └──► ChromaDB Panel: GET /api/iso27001/chromadb/stats
              Total documents, total chunks
              Distance metric (cosine)
              ─────────────────────────────
              [Search Test Box]
              POST /api/iso27001/chromadb/search { query }
              Returns top-3 matching chunks with score
              ─────────────────────────────
              [Reindex Button]
              POST /api/iso27001/chromadb/reload
              Clears DB → scans data/iso_documents/
              Chunks all .md files → embeds → stores
```

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|-----------|---------|------|
| **Next.js** | 15.1 | App Router, SSR, API route proxying |
| **React** | 19.0 | Component model, `useState`, `useEffect` |
| **CSS Modules** | — | Scoped styling with CSS custom properties |
| **react-markdown** | 9.0 | Renders AI-generated markdown reports |
| **remark-gfm** | 4.0 | GitHub-flavored markdown tables/lists |

### Backend

| Technology | Version | Role |
|-----------|---------|------|
| **FastAPI** | 0.115 | Async REST API framework |
| **Python** | 3.11 | Runtime |
| **Pydantic** | v2 | Input validation schemas |
| **slowapi** | — | Per-endpoint rate limiting |
| **feedparser** | — | RSS feed parsing |
| **BeautifulSoup4** | — | Primary HTML scraper |
| **trafilatura** | — | Fallback article extractor |
| **newspaper3k** | — | Final-fallback article extractor |
| **edge-tts** | — | Microsoft Edge Text-to-Speech (async) |
| **chromadb** | — | Local vector store (SQLite backend) |
| **sentence-transformers** | — | `all-MiniLM-L6-v2` embedding model |
| **transformers + torch** | — | VinAI Translate (EN→VI, 135M params) |
| **httpx** | — | Async HTTP client for Cloud LLM calls |

### Infrastructure

| Technology | Role |
|-----------|------|
| **Docker + Docker Compose** | Container orchestration |
| **LocalAI** | OpenAI-compatible local inference server (GGUF) |
| **ChromaDB (SQLite)** | On-disk vector database |
| **Docker bridge network** | Isolated inter-container communication |
| **Docker Volumes** | Persistent data mount at `/data` |

---

## AI Models

| # | Model | Provider | Parameters | Role |
|---|-------|----------|-----------|------|
| 1 | **gemini-3-pro-preview** | Open Claude (Cloud) | — | Primary LLM for chat, summarization, ISO analysis |
| 2 | **OpenRouter models** | OpenRouter (Cloud) | — | Secondary cloud fallback for all LLM tasks |
| 3 | **Llama 3.1 70B Instruct Q4_K_M** | LocalAI (On-premise) | 70B | Offline fallback LLM — chat, ISO report generation |
| 4 | **SecurityLLM (7B Q4_K_M)** | LocalAI (On-premise) | 7B | Security-specialized model for ISO gap analysis |
| 5 | **VinAI Translate (envit5-translation)** | HuggingFace / CPU | 135M | EN→VI title translation, fully offline |
| 6 | **all-MiniLM-L6-v2** | sentence-transformers | 22M | Text embedding for ChromaDB vector search |
| 7 | **Edge-TTS (vi-VN-HoaiMyNeural)** | Microsoft (online) | — | Vietnamese Text-to-Speech audio generation |

### AI Orchestration Logic

```
Task arrives at CloudLLMService
        │
        ├── task_type = "localai_only"? ──YES──► LocalAI directly
        │
        └── Cloud path:
              Try Open Claude keys (round-robin)
                    │ 429 → cooldown 60s, try next key
                    │ All keys exhausted?
                    ▼
              Try OpenRouter keys (round-robin)
                    │ All keys exhausted?
                    ▼
              Try LocalAI (final fallback)
                    │ Timeout: INFERENCE_TIMEOUT (120s)
                    ▼
              Return result or raise exception
```

---

## Quick Start

### Prerequisites
- Docker Engine + Docker Compose (v2)
- 16 GB RAM minimum (32 GB recommended for 70B model)
- 30 GB free disk space for GGUF models

### 1. Clone & Setup
```bash
git clone https://github.com/NghiaDinh03/phobert-chatbot-project.git
cd phobert-chatbot-project
cp .env.example .env
```

### 2. Configure API Keys (`.env`)
```env
# Primary Cloud LLM — Open Claude (required for chat to work)
CLOUD_API_KEYS=your_key_1,your_key_2
CLOUD_LLM_API_URL=https://open-claude.com/v1
CLOUD_MODEL_NAME=gemini-3-pro-preview

# Secondary fallback (optional but recommended)
OPENROUTER_API_KEYS=your_openrouter_key

# CORS — restrict to your domain in production
CORS_ORIGINS=http://localhost:3000
```

> ⚠️ At least **one** `CLOUD_API_KEYS` entry is required. Multiple keys separated by commas enable automatic Round-Robin load balancing and rate-limit recovery.

### 3. Build & Launch
```bash
docker-compose up --build -d
```

First run downloads GGUF models (~15–25 GB) and builds all images — allow 15–30 minutes.

### 4. Access
Open **http://localhost:3000** in your browser.

### 5. Optional Performance Tuning
```env
TORCH_THREADS=4           # CPU threads for VinAI translation
MAX_CONCURRENT_REQUESTS=3 # Max parallel AI requests
INFERENCE_TIMEOUT=120     # LocalAI timeout (seconds)
CLOUD_TIMEOUT=60          # Cloud API timeout (seconds)
```

---

## Environment Variables

| Variable | Default | Description |
|---------|---------|-------------|
| `CLOUD_API_KEYS` | `` | Comma-separated Open Claude API keys |
| `CLOUD_LLM_API_URL` | `https://open-claude.com/v1` | Cloud LLM base URL |
| `CLOUD_MODEL_NAME` | `gemini-3-pro-preview` | Cloud model identifier |
| `OPENROUTER_API_KEYS` | `` | Comma-separated OpenRouter API keys |
| `LOCALAI_URL` | `http://localai:8080` | LocalAI server URL |
| `MODEL_NAME` | `Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf` | LocalAI primary model |
| `SECURITY_MODEL_NAME` | same as MODEL_NAME | LocalAI security model |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `TORCH_THREADS` | auto (cpu_count) | PyTorch thread count for translation |
| `MAX_CONCURRENT_REQUESTS` | `3` | Semaphore limit for concurrent AI calls |
| `INFERENCE_TIMEOUT` | `120` | Timeout (s) for LocalAI calls |
| `CLOUD_TIMEOUT` | `60` | Timeout (s) for Cloud LLM calls |
| `RATE_LIMIT_CHAT` | `10/minute` | Chat endpoint rate limit |
| `RATE_LIMIT_ASSESS` | `3/minute` | Assessment endpoint rate limit |
| `RATE_LIMIT_NEWS` | `5/minute` | News summarize endpoint rate limit |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `DEBUG` | `false` | Enable debug logging |

---

## Documentation

| Document | Description |
|---------|-------------|
| [Architecture](./docs/architecture.md) | Container topology, network routing, AI orchestration |
| [API Reference](./docs/api.md) | All FastAPI endpoints with request/response schemas |
| [News Aggregator](./docs/news_aggregator.md) | RSS fetch, translation, TTS audio generation flow |
| [Chatbot RAG](./docs/chatbot_rag.md) | Vector embedding, ChromaDB retrieval, LLM pipeline |
| [ISO Assessment](./docs/iso_assessment_form.md) | Multi-step form, dual-LLM analysis, report generation |
| [Analytics](./docs/analytics_monitoring.md) | Dashboard panels, system stats, ChromaDB management |
| [ChromaDB Guide](./docs/chromadb_guide.md) | Adding documents, reindexing, troubleshooting |
| [Deployment Guide](./docs/deployment.md) | System requirements, Docker setup, health checks |
| [Markdown RAG Standard](./docs/markdown_rag_standard.md) | How to format .md files for optimal RAG quality |
| [Multi-Standard Plan](./docs/multi_standard_assessment_plan_v2.md) | ISO 27001 + TCVN 11930 assessment architecture |

---

## Performance Reference

| Metric | Value |
|--------|-------|
| Chat response (Cloud) | ~2–5 seconds |
| Chat response (LocalAI 70B) | ~30–60 seconds (fallback) |
| News title translation (batch 8) | ~3–8 seconds |
| Article scrape + summarize + TTS | ~15–40 seconds (first call) |
| Audio playback (cached) | ~0 ms (instant, file served) |
| ChromaDB vector search (top-3) | < 100 ms |
| Session memory per session | 20 messages, 24h TTL |
| Audio/Summary cache TTL | 7 days auto-cleanup |
| Docker memory limits | Backend: 6 GB, LocalAI: 12 GB, Frontend: 2 GB |

---

## License

This project is proprietary and built for enterprise cybersecurity assessment purposes.
