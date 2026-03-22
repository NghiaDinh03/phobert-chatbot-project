# 🧠 Project Context — CyberAI Assessment Platform

## ⚠️ Dev Rules (AI MUST follow)

1. **Clean code only** — no junk comments, no TODO/FIXME left behind, no commented-out code
2. **Comments must be meaningful** — explain WHY, not WHAT. No obvious comments like `# loop through items`
3. **Always present a PLAN first** — never auto-modify files without user approval
4. **No unnecessary changes** — don't refactor things that aren't broken
5. **Keep existing patterns** — match the coding style already in the project
6. **Test mentally before committing** — think through edge cases
7. **Git commits must be atomic** — one purpose per commit, clear message
8. **Never push sensitive data** — .env, API keys, secrets must stay in .gitignore
9. **Vietnamese UI text** — all user-facing text in Vietnamese unless technical terms
10. **Update this context.md** when making structural changes

---

## 📁 Project Structure

```
phobert-chatbot-project/
├── docker-compose.yml          # 3 services: backend, frontend, localai
├── .env.example                # Environment template (API keys, model config)
├── .gitignore                  # Ignores .env, models/, node_modules/, .claude/
├── context.md                  # THIS FILE — project context for AI
│
├── backend/                    # FastAPI Python backend
│   ├── Dockerfile              # python:3.10-slim, pip install, uvicorn 2 workers
│   ├── main.py                 # FastAPI app, CORS, rate limiting, route registration
│   ├── requirements.txt        # torch, transformers, chromadb, fastapi, edge-tts, etc.
│   ├── core/
│   │   ├── config.py           # Settings class — env vars for all services
│   │   └── exceptions.py       # Custom exception classes
│   ├── api/routes/
│   │   ├── chat.py             # POST /api/chat — streaming SSE chat endpoint
│   │   ├── document.py         # Document upload & RAG indexing
│   │   ├── health.py           # GET /api/health
│   │   ├── iso27001.py         # POST /api/assess — ISO assessment endpoint
│   │   ├── news.py             # GET /api/news — RSS aggregator + audio
│   │   └── system.py           # GET /api/system/stats — CPU/RAM/Disk monitoring
│   ├── services/
│   │   ├── chat_service.py     # Chat routing, session management, streaming
│   │   ├── cloud_llm_service.py # Multi-tier LLM: Open Claude → OpenRouter → LocalAI
│   │   ├── model_router.py     # Hybrid intent classifier (semantic + keyword)
│   │   ├── rag_service.py      # RAG retrieval + generation with CloudLLM
│   │   ├── news_service.py     # RSS parsing, translation queue, LLM tagging worker
│   │   ├── summary_service.py  # Article scraping (newspaper4k) + Cloud LLM translate + Edge-TTS
│   │   ├── translation_service.py # VinAI translate model (en→vi), batch + cache
│   │   ├── web_search.py       # DuckDuckGo search integration
│   │   ├── document_service.py # File upload processing
│   │   └── gemini_service.py   # DEPRECATED — wrapper for cloud_llm_service
│   ├── repositories/
│   │   ├── vector_store.py     # ChromaDB vector store, markdown chunking, cosine search
│   │   └── session_store.py    # JSON file-based session storage
│   └── utils/
│       ├── helpers.py          # Utility functions
│       └── logger.py           # Logging configuration
│
├── frontend-next/              # Next.js 15 + React 19 frontend
│   ├── Dockerfile              # Multi-stage production build
│   ├── Dockerfile.dev          # Dev mode with hot reload
│   ├── package.json            # next, react, react-markdown, remark-gfm
│   └── src/
│       ├── app/
│       │   ├── globals.css     # CSS variables (dark default + light mode via data-theme)
│       │   ├── layout.js       # Root layout with ThemeProvider + Navbar
│       │   ├── page.js         # Homepage — feature cards + system stats
│       │   ├── chatbot/page.js # AI Chat — SSE streaming, session management
│       │   ├── analytics/page.js # System monitoring dashboard
│       │   ├── form-iso/page.js  # Multi-standard ISO assessment form (3 steps)
│       │   ├── news/page.js    # News aggregator with TTS audio playback
│       │   ├── templates/page.js # Pre-built system templates for assessment
│       │   └── api/            # Next.js API routes (proxy to backend)
│       ├── components/
│       │   ├── Navbar.js       # Navigation bar with theme toggle (☀️/🌙)
│       │   ├── Navbar.module.css
│       │   ├── ThemeProvider.js # Dark/Light mode context + localStorage persistence
│       │   ├── SystemStats.js  # CPU/RAM/Disk real-time monitoring widget
│       │   └── SystemStats.module.css
│       ├── data/               # Static data (control descriptions, standards, templates)
│       └── lib/api.js          # API client helper
│
├── data/                       # Persistent data (mounted as Docker volume)
│   ├── iso_documents/          # Markdown docs for RAG (ISO 27001, TCVN, laws)
│   ├── knowledge_base/         # JSON knowledge bases
│   ├── vector_store/           # ChromaDB persistent storage
│   ├── summaries/              # Cached article translations + audio/*.mp3
│   ├── translations/           # VinAI translation cache per category
│   ├── sessions/               # Chat session files
│   └── articles_history.json   # News history with tags, translations
│
├── models/                     # GGUF models for LocalAI (gitignored)
└── docs/                       # Project documentation
```

---

## 🔧 Key Architecture Decisions

### LLM Strategy: Multi-tier Fallback
```
Open Claude (gemini-3-pro-preview) → OpenRouter (free models) → LocalAI (GGUF on CPU)
```
- Primary: Cloud LLM via `cloud_llm_service.py` — fast, smart
- Fallback: LocalAI for offline/when cloud is down
- Config: `CLOUD_API_KEYS`, `OPENROUTER_API_KEYS` in `.env`

### News Pipeline
```
RSS Feed → Parse → VinAI Title Translation → Cloud LLM Full Translation → Edge-TTS Audio
```
- Background workers: `_translation_worker()` + `_llama_worker()` in `news_service.py`
- Article scraping: `newspaper4k` with retry logic (3 attempts, 3-9s delay)
- Error cache: `retryable: true` flag — auto-cleared on next processing cycle

### RAG (Retrieval-Augmented Generation)
- Vector store: ChromaDB with cosine similarity
- Documents: Markdown files in `data/iso_documents/`
- Chunking: Header-aware semantic chunking (600 chars, 150 overlap)
- Multi-query search for ISO/TCVN terms

### Theme System
- CSS Variables in `globals.css` — `:root` (dark) + `[data-theme="light"]`
- `ThemeProvider.js` — React context, localStorage persistence
- Toggle button in `Navbar.js` — ☀️ (dark→light) / 🌙 (light→dark)

---

## 🐳 Docker Services

| Service | Port | Image | RAM Limit |
|---------|------|-------|-----------|
| backend | 8000 | python:3.10-slim + FastAPI | 6GB |
| frontend | 3000 | node:20-alpine + Next.js dev | 2GB |
| localai | 8080 | localai/localai:v2.24.2 | 12GB |

### Key Environment Variables
- `MODEL_NAME` — GGUF model filename for LocalAI
- `CLOUD_API_KEYS` — comma-separated API keys for Cloud LLM
- `CLOUD_MODEL_NAME` — default: `gemini-3-pro-preview`
- `TORCH_THREADS` — PyTorch CPU thread limit (default: 4)
- `CONTEXT_SIZE` — LocalAI context window (default: 8192)

---

## 📝 Recent Changes Log

| Date | Change |
|------|--------|
| 2026-03-22 | Added dark/light theme toggle (ThemeProvider, Navbar button) |
| 2026-03-22 | Fixed article scraping: 3x retry with delay, browser User-Agent |
| 2026-03-22 | Added `retryable` flag for cached scraping errors, auto-clear on retry |
| 2026-03-22 | Updated .gitignore: added .claude/, *.key, *.pem, *.cert, *.secret |
| 2026-03-22 | Upgraded to v2: Cloud LLM multi-tier fallback, new services |
