# 🧠 Project Context — CyberAI Assessment Platform

> **Mục đích file này**: AI đọc file này để hiểu toàn bộ project mà không cần đọc từng file riêng lẻ.
> **Cập nhật**: Khi sửa code, update cả file này.

## ⚠️ Dev Rules (AI MUST follow)

1. **Clean code only** — no junk comments, no TODO/FIXME left behind, no commented-out code
2. **Comments must be meaningful** — explain WHY, not WHAT. No obvious comments
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
├── docker-compose.yml          # 3 services: backend(8000), frontend(3000), localai(8080)
├── .env.example                # Environment template
├── .gitignore                  # Ignores .env, models/, node_modules/, .claude/, *.key
├── context.md                  # THIS FILE
├── backend/                    # FastAPI Python backend
│   ├── Dockerfile              # python:3.10-slim, uvicorn 2 workers
│   ├── main.py                 # App entry, CORS, rate limiting, routes
│   ├── requirements.txt        # torch, transformers, chromadb, fastapi, edge-tts
│   ├── core/config.py          # Settings class from env vars
│   ├── api/routes/             # chat, document, health, iso27001, news, system
│   ├── services/               # Business logic layer
│   │   ├── chat_service.py     # Chat + streaming + session + assessment
│   │   ├── cloud_llm_service.py # Multi-tier: Open Claude → OpenRouter → LocalAI
│   │   ├── model_router.py     # Hybrid intent classifier (semantic+keyword)
│   │   ├── rag_service.py      # RAG with CloudLLM
│   │   ├── news_service.py     # RSS + translation queue + LLM tagging worker
│   │   ├── summary_service.py  # Article scrape + translate + Edge-TTS
│   │   ├── translation_service.py # VinAI en→vi model
│   │   └── web_search.py       # DuckDuckGo search
│   └── repositories/           # vector_store.py (ChromaDB), session_store.py
├── frontend-next/              # Next.js 15 + React 19
│   ├── src/app/                # Pages: home, chatbot, analytics, form-iso, news, templates
│   ├── src/components/         # Navbar, SystemStats, ThemeProvider
│   └── src/lib/api.js          # API client
├── data/                       # Persistent volume: iso_documents, vector_store, summaries
└── models/                     # GGUF models (gitignored)
```

---

## 🐳 Docker Services

| Service | Port | Image | RAM |
|---------|------|-------|-----|
| backend | 8000 | python:3.10-slim + FastAPI | 6GB |
| frontend | 3000 | node:20-alpine + Next.js | 2GB |
| localai | 8080 | localai/localai:v2.24.2 | 12GB |

Key env vars: `MODEL_NAME`, `CLOUD_API_KEYS`, `CLOUD_MODEL_NAME`, `TORCH_THREADS`, `CONTEXT_SIZE`

---

## 🔧 Architecture

### LLM: Open Claude → OpenRouter → LocalAI fallback
### News: RSS → VinAI Title Translate → Cloud LLM Full Translate → Edge-TTS Audio
### RAG: ChromaDB cosine, markdown chunking (600 chars, 150 overlap)
### Theme: CSS vars `:root`(dark) + `[data-theme="light"]`, ThemeProvider + localStorage

---

## 📄 BACKEND SOURCE CODE

### backend/main.py
```python
"""CyberAI Assessment API v2.0 — FastAPI with CORS, rate limiting, and custom error handlers."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    _has_rate_limit = True
except ImportError:
    limiter = None
    _has_rate_limit = False
    logger.warning("slowapi not installed — rate limiting disabled")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered ISO 27001 compliance chatbot with gemini-3-pro-preview",
    version=settings.APP_VERSION,
    docs_url="/docs", redoc_url="/redoc",
)

if _has_rate_limit:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={
        "error": "Not found", "detail": str(exc.detail) if hasattr(exc, 'detail') else "Resource not found"})

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(status_code=500, content={
        "error": "Internal server error", "detail": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại."})

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.url.path not in ["/api/documents/upload"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 2 * 1024 * 1024:
            return JSONResponse(status_code=413, content={"error": "Request body too large", "max_size": "2MB"})
    return await call_next(request)

from api.routes import chat, document, health, iso27001, system, news
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(document.router, prefix="/api", tags=["Documents"])
app.include_router(iso27001.router, prefix="/api", tags=["ISO27001"])
app.include_router(system.router, prefix="/api", tags=["System"])
app.include_router(news.router, prefix="/api", tags=["News"])

@app.on_event("startup")
def on_startup():
    for w in settings.validate():
        logger.warning(w)
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    logger.info(f"   Cloud LLM: {settings.CLOUD_LLM_API_URL} (model: {settings.CLOUD_MODEL_NAME})")
    logger.info(f"   Cloud API keys: {len(settings.cloud_api_key_list)}")
    logger.info(f"   LocalAI: {settings.LOCALAI_URL}")
    logger.info(f"   CORS origins: {settings.cors_origins_list}")
    logger.info(f"   CPU threads (torch): {settings.TORCH_THREADS}")
    from services.news_service import start_bg_worker
    start_bg_worker()
    try:
        from repositories.session_store import SessionStore
        cleaned = SessionStore().cleanup_expired()
        if cleaned:
            logger.info(f"Cleaned {cleaned} expired sessions on startup")
    except Exception as e:
        logger.warning(f"Session cleanup error: {e}")

@app.get("/")
def root():
    return {"status": "running", "service": settings.APP_NAME, "version": settings.APP_VERSION,
            "ai_model": settings.CLOUD_MODEL_NAME, "ai_provider": "Open Claude (gemini-3-pro-preview)", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.APP_VERSION}
```

### backend/core/config.py
```python
import os
from typing import List

class Settings:
    APP_NAME: str = "CyberAI Assessment API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOCALAI_URL: str = os.getenv("LOCALAI_URL", "http://localai:8080")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf")
    SECURITY_MODEL_NAME: str = os.getenv("SECURITY_MODEL_NAME", os.getenv("MODEL_NAME", "Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "-1"))
    CLOUD_LLM_API_URL: str = os.getenv("CLOUD_LLM_API_URL", "https://open-claude.com/v1")
    CLOUD_MODEL_NAME: str = os.getenv("CLOUD_MODEL_NAME", "gemini-3-pro-preview")
    CLOUD_API_KEYS: str = os.getenv("CLOUD_API_KEYS", os.getenv("OPENROUTER_API_KEYS", ""))
    OPENROUTER_API_KEYS: str = os.getenv("OPENROUTER_API_KEYS", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    OPENROUTER_API_URL: str = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1")
    GEMINI_API_KEYS: str = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
    ISO_DOCS_PATH: str = os.getenv("ISO_DOCS_PATH", "/data/iso_documents")
    VECTOR_STORE_PATH: str = os.getenv("VECTOR_STORE_PATH", "/data/vector_store")
    DATA_PATH: str = os.getenv("DATA_PATH", "/data")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    RATE_LIMIT_CHAT: str = os.getenv("RATE_LIMIT_CHAT", "10/minute")
    RATE_LIMIT_ASSESS: str = os.getenv("RATE_LIMIT_ASSESS", "3/minute")
    RATE_LIMIT_NEWS: str = os.getenv("RATE_LIMIT_NEWS", "5/minute")
    TORCH_THREADS: int = int(os.getenv("TORCH_THREADS", str(os.cpu_count() or 4)))
    INFERENCE_TIMEOUT: int = int(os.getenv("INFERENCE_TIMEOUT", "120"))
    CLOUD_TIMEOUT: int = int(os.getenv("CLOUD_TIMEOUT", "60"))
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", "3"))

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def cloud_api_key_list(self) -> List[str]:
        all_keys = []
        for env_val in [self.CLOUD_API_KEYS, self.OPENROUTER_API_KEYS, self.GEMINI_API_KEYS]:
            if env_val:
                for k in env_val.split(","):
                    k = k.strip()
                    if k and k not in all_keys and k != "your_gemini_api_key_here":
                        all_keys.append(k)
        return all_keys

    @property
    def openrouter_api_key_list(self) -> List[str]:
        return [k.strip() for k in self.OPENROUTER_API_KEYS.split(",") if k.strip()]

    def validate(self):
        warnings = []
        if not self.cloud_api_key_list:
            warnings.append("⚠️  No CLOUD_API_KEYS — LocalAI only (slow on CPU)")
        if self.JWT_SECRET == "change-me-in-production":
            warnings.append("⚠️  JWT_SECRET not changed — not safe for production")
        if "*" in self.CORS_ORIGINS:
            warnings.append("⚠️  CORS_ORIGINS='*' — should restrict to specific domains")
        return warnings

settings = Settings()
```

### backend/services/cloud_llm_service.py
> Multi-tier LLM fallback: Open Claude → OpenRouter → LocalAI
> Key methods: `chat_completion()`, `quick_completion()`, `health_check()`
> Uses httpx for cloud calls, requests for LocalAI
> API key rotation with cooldown on 429 rate limits

### backend/services/chat_service.py
> Chat routing with session memory, Cloud-first strategy
> `generate_response()` — sync chat, `generate_response_stream()` — SSE streaming
> Uses `route_model()` for intent classification → security/search/general
> `assess_system()` — 2-phase ISO assessment (security analysis → format report)
> Vector store + session store lazy initialization with thread locks

### backend/services/model_router.py
> Hybrid routing: semantic ChromaDB classifier + keyword regex fallback
> Intent templates: security, search, general
> ISO keywords, search keywords, strict ISO keywords
> Returns: `{model, use_rag, use_search, route, confidence, classification_method}`

### backend/services/news_service.py
> RSS sources: cybersecurity (3), stocks_international (3), stocks_vietnam (3)
> Background workers: `_translation_worker()` (VinAI titles), `_llama_worker()` (summarize+tag)
> `_auto_translate_worker()` — cron every 5h, triggers get_news + cleans stale cache
> History: JSON file, 7-day retention, auto-cleanup
> Uses `skip_retryable=True` to auto-retry failed article scraping

### backend/services/summary_service.py
> Article processing: scrape (newspaper4k, 3 retries with 3-9s delay) → Cloud LLM translate → Edge-TTS
> Cache with `retryable: true` flag for scraping errors (auto-cleared on next cycle)
> Browser User-Agent spoofing for anti-bot bypass
> Pronunciation fix for TTS (acronyms → Vietnamese phonetic)

### backend/services/translation_service.py
> VinAI `vinai/vinai-translate-en2vi` model, lazy-loaded on first use
> Batch translation with chunking (8 per batch)
> Persistent file cache per category, 12h TTL
> CPU optimized: torch thread control, JIT optimization attempt

### backend/repositories/vector_store.py
> ChromaDB PersistentClient, collection "iso_documents", cosine similarity
> Semantic chunking: header-aware (600 chars, 150 overlap)
> `multi_query_search()` — expands queries for ISO/TCVN terms
> Auto-indexes markdown files from `data/iso_documents/` on first search

### backend/repositories/session_store.py
> File-based JSON sessions in `data/sessions/`
> 24h TTL auto-expiry, max 20 messages per session
> Thread-safe with `threading.Lock()`

### backend/api/routes/ (summary)
- **chat.py**: POST /api/chat, POST /api/chat/stream (SSE), GET/DELETE /api/chat/history/{id}
- **news.py**: GET /api/news, POST /api/news/summarize, POST /api/news/reprocess, GET /api/news/audio/{file}
- **iso27001.py**: POST /api/iso27001/assess (background task), GET assessments, ChromaDB stats/search/reindex
- **system.py**: GET /api/system/stats (CPU/RAM/Disk from /proc), GET /api/system/cache-stats
- **health.py**: GET /api/health
- **document.py**: POST /api/documents/upload

---

## 📄 FRONTEND SOURCE CODE

### frontend-next/src/app/layout.js
```jsx
import './globals.css'
import Navbar from '@/components/Navbar'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata = {
    title: 'CyberAI Assessment Platform - Enterprise Edition',
    description: 'Nền tảng AI tiên tiến cho đánh giá tuân thủ ISO 27001:2022 & TCVN 14423',
    icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body>
                <ThemeProvider>
                    <Navbar />
                    <main>{children}</main>
                </ThemeProvider>
            </body>
        </html>
    )
}
```

### frontend-next/src/components/ThemeProvider.js
```jsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ theme: 'dark', toggle: () => { } })

export function useTheme() { return useContext(ThemeContext) }

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('phobert_theme')
        if (saved === 'light' || saved === 'dark') {
            setTheme(saved)
            document.documentElement.setAttribute('data-theme', saved)
        }
        setMounted(true)
    }, [])

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('phobert_theme', next)
    }

    if (!mounted) return <>{children}</>
    return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
```

### frontend-next/src/components/Navbar.js
> Nav items: Trang chủ, AI Chat, Analytics, Form ISO, Kho Mẫu, Tin tức
> Theme toggle button (☀️/🌙) using `useTheme()` hook
> Timezone switcher (VN/UTC/US/JP) with localStorage persistence
> Online status indicator, clock display

### frontend-next/src/app/page.js (Homepage)
> Feature cards linking to: /chatbot, /form-iso, /templates, /analytics, /news
> SystemStats component showing CPU/RAM/Disk in real-time
> Hero section with gradient title

### frontend-next/src/app/chatbot/page.js
> Full chat UI: sidebar sessions, message list, input bar
> SSE streaming with step indicators (routing → rag → searching → thinking → done)
> Session management: create, switch, delete, localStorage persistence
> Markdown rendering with ReactMarkdown + remarkGfm
> Suggestion chips for quick questions
> Pending request recovery on page reload

### frontend-next/src/app/news/page.js
> 3 category tabs: An Ninh Mạng, Cổ Phiếu Quốc Tế, Chứng Khoán VN
> Article cards with: title, Vietnamese translation, source, date, tag
> Audio playback: per-article + "Play All" mode with auto-next
> Search with debounce (500ms), DuckDuckGo fallback
> History sidebar (7 days), reprocess button per article
> AI status monitor polling every 2s
> Background refresh every 5s for pending translations

### frontend-next/src/app/analytics/page.js
> SystemStats widget, service status cards (Backend, LocalAI, ChromaDB, VinAI, models)
> Cache stats (translations, summaries, total storage)
> ISO assessment history table with detail modal + reuse form button
> ChromaDB panel: chunk/file stats, semantic search, reindex button
> System config display (context size, max tokens, threads)

### frontend-next/src/app/form-iso/page.js
> 4-step wizard: Organization → Infrastructure → Controls → Description
> Multi-standard support (ISO 27001 / TCVN 11930) with dynamic control lists
> Accordion categories with select-all, compliance progress bar
> Control detail side panel with requirement/criteria/guidance
> Background assessment polling (10s interval)
> History tab with server-side assessment list
> Template reuse from localStorage

### frontend-next/src/app/templates/page.js
> Pre-built system templates for assessment testing
> Filter by standard (ISO 27001 / TCVN 11930)
> Template cards with: stats, infrastructure info, compliance bar
> Click to auto-fill form-iso page via localStorage

### CSS Architecture
> globals.css: `:root` dark vars + `[data-theme="light"]` overrides
> Module CSS per page/component (dark-first design)
> Navbar.module.css includes `.themeToggle` button style

---

## 📝 Recent Changes Log

| Date | Change |
|------|--------|
| 2026-03-22 | Added dark/light theme toggle (ThemeProvider, Navbar button) |
| 2026-03-22 | Fixed article scraping: 3x retry with delay, browser User-Agent |
| 2026-03-22 | Added `retryable` flag for cached scraping errors, auto-clear on retry |
| 2026-03-22 | Updated .gitignore: added .claude/, *.key, *.pem, *.cert, *.secret |
| 2026-03-22 | Upgraded to v2: Cloud LLM multi-tier fallback, new services |
| 2026-03-22 | Created context.md for AI project understanding |
