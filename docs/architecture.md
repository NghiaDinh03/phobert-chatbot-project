# System Architecture — CyberAI Assessment Platform v2.0

## 1. Container Topology

The system runs as 3 Docker containers connected via `phobert-network` (internal bridge — not exposed to host). All containers share a single `/data` volume mount for persistent storage.

```
Host Machine (Windows/Linux/WSL2)
│
├─ Port 3000 ──► phobert-frontend  (Next.js 15)
│
├─ Port 8000 ──► phobert-backend   (FastAPI / Python 3.11)
│
└─ Port 8080 ──► phobert-localai   (LocalAI — OpenAI-compat GGUF server)
                    └─ /models/Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf
                    └─ /models/SecurityLLM-7B-Q4_K_M.gguf

Shared Docker Volume  →  ./data:/data
  data/
  ├─ iso_documents/       ← .md knowledge base files for RAG
  ├─ vector_store/        ← ChromaDB SQLite + HNSW index files
  ├─ summaries/           ← JSON cache for article summaries
  │   └─ audio/           ← Generated MP3 files (Edge-TTS)
  ├─ sessions/            ← Chat session JSON files (24h TTL)
  ├─ translations/        ← Title translation cache (per-category)
  ├─ uploads/             ← User-uploaded files (future)
  └─ knowledge_base/      ← Static JSON for ISO 27001 / TCVN controls
```

---

## 2. Request Routing

### Frontend → Backend (No direct API calls from browser)

`next.config.js` defines a wildcard rewrite:
```
/api/:path*  →  http://backend:8000/api/:path*
```

This means:
- The browser only ever talks to the Next.js server (port 3000)
- Next.js proxies all `/api/*` requests to FastAPI on the `phobert-network`
- **Zero CORS issues**, no API keys exposed to the browser
- A few routes (chat, news history, reprocess) have dedicated Next.js API route files that add custom headers or transform responses before forwarding

### Backend → Cloud AI

```
CloudLLMService (_call_open_claude / _call_localai)
       │
       ▼
  Key list from CLOUD_API_KEYS (comma-separated)
       │
       ├── Round-Robin key selection (cls._key_index)
       │
       ├── HTTP 429 / rate limit → lock key 60s, advance index
       │
       ├── HTTP 5xx / timeout → retry with next key
       │
       ▼
  If all Cloud keys fail → OpenRouter keys (same round-robin)
       │
       ▼
  If all OpenRouter keys fail → LocalAI (http://localai:8080)
       │
       ▼
  If LocalAI timeout → raise exception → 500 to frontend
```

---

## 3. Backend Module Map

```
backend/
├─ main.py                        ← FastAPI app, CORS, rate limit middleware
├─ core/
│   └─ config.py                  ← Settings from env vars, key validation
├─ api/
│   └─ routes/
│       ├─ chat.py                ← POST /api/chat
│       ├─ iso27001.py            ← POST /api/iso27001/assess, history, chromadb
│       ├─ news.py                ← GET /api/news, POST /api/news/summarize
│       └─ system.py              ← GET /api/system/stats, cache-stats
└─ services/
    ├─ chat_service.py            ← Session memory + routing + RAG + LLM call
    ├─ cloud_llm_service.py       ← Multi-provider LLM client (Open Claude / OpenRouter / LocalAI)
    ├─ rag_service.py             ← ChromaDB retrieval, multi-query search
    ├─ summary_service.py         ← Article scrape → AI translate → Edge-TTS → MP3 cache
    ├─ news_service.py            ← RSS fetch, background translation/tagging workers
    ├─ iso27001_service.py        ← Dual-LLM ISO assessment pipeline
    ├─ model_router.py            ← Keyword-weighted route classifier (7 categories)
    ├─ session_store.py           ← File-based session persistence, 24h TTL
    └─ vector_store.py            ← ChromaDB wrapper, header-aware chunking, embedding
```

---

## 4. AI Orchestration Model

### Model Selection per Task

| Task | Primary | Fallback 1 | Fallback 2 |
|------|---------|-----------|-----------|
| Chat response | Open Claude | OpenRouter | LocalAI 70B |
| ISO gap analysis | Open Claude (security prompt) | OpenRouter | LocalAI 70B |
| ISO report generation | Open Claude | OpenRouter | LocalAI 70B |
| Article summarization | Open Claude | OpenRouter | LocalAI 70B |
| Title translation | VinAI Translate (local CPU) | — | — |
| Article tagging | Open Claude | OpenRouter | LocalAI 70B |
| Vector embedding | all-MiniLM-L6-v2 (local CPU) | — | — |
| Text-to-speech | Edge-TTS (online, async) | — | — |

### TASK_MODEL_MAP (cloud_llm_service.py)

```python
TASK_MODEL_MAP = {
    "chat": "gemini-3-pro-preview",
    "summary": "gemini-3-pro-preview",
    "assessment": "gemini-3-pro-preview",
    "translation": "gemini-3-pro-preview",
    "tagging": "gemini-3-pro-preview",
}
```

All tasks resolve to the same cloud model unless overridden via `model_override` parameter.

---

## 5. Data Flow Security Model

```
Internet
   │
   ▼
[User Browser]
   │  HTTPS (your reverse proxy / Nginx)
   ▼
[Next.js :3000]     ← Only exposed port to browser
   │  Internal bridge (phobert-network)
   ▼
[FastAPI :8000]     ← Validates Pydantic schemas, rate limits, CORS whitelist
   │
   ├──► [LocalAI :8080]   ← Internal only, never exposed to host
   │
   ├──► [ChromaDB]        ← File-based, inside container
   │
   └──► [Cloud APIs]      ← Outbound HTTPS only
```

- **CORS**: Configurable whitelist via `CORS_ORIGINS` env var — no wildcard `*` in production
- **Rate limiting**: `slowapi` — chat: 10/min, assess: 3/min, news: 5/min
- **Request size**: 2 MB middleware cap to prevent abuse
- **Input validation**: Pydantic models with `min_length=1, max_length=2000` on all text fields
- **API keys**: Never passed to frontend, stored only in backend env vars

---

## 6. ChromaDB / RAG Architecture

```
data/iso_documents/*.md
        │
        ▼
[vector_store.py: load_documents()]
  ├─ Read each .md file
  ├─ Header-aware chunking (## boundary detection)
  │   chunk_size = 500 chars, overlap = 150 chars
  │   Parent header prepended to each split chunk
  └─ all-MiniLM-L6-v2 embeddings (384-dim vectors)
        │
        ▼
[ChromaDB: data/vector_store/chroma.sqlite3]
  Metric: Cosine Similarity
  Collection: "iso_knowledge"
        │
        ▼
[Query time: rag_service.py]
  Embed user question → 384-dim vector
  collection.query(n_results=3)
  Returns: [chunk_text, source_file, score]
        │
        ▼
[Inject into LLM prompt as RAG context]
```

---

## 7. Session Memory Architecture

```
POST /api/chat { message, session_id }
        │
        ▼
[session_store.py]
  Load data/sessions/<session_id>.json
  Contains: [ {role, content, timestamp}, ... ]
  Max: 20 most recent messages kept
  TTL: 24 hours from last_accessed
        │
        ▼
  Prepend history to LLM messages array
  → LLM sees full conversation context
        │
        ▼
  Append new user+assistant turn
  Save back to JSON file
```
