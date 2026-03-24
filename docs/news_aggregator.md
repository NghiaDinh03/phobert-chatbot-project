# AI News Aggregator & Text-to-Speech — Mechanism Flow

The News page provides automated cybersecurity and financial news aggregation with Vietnamese AI translation and audio playback. It runs two independent pipelines: a **background RSS pipeline** (automatic) and an **on-demand audio pipeline** (user-triggered).

---

## 1. RSS Background Pipeline (Automatic)

```
[Timer: every ~2 hours OR user opens /news page]
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ news_service.py: get_news(category)                             │
│                                                                 │
│  feedparser.parse(rss_url)                                      │
│                                                                 │
│  Sources by category:                                           │
│  • cybersecurity  → The Hacker News, BleepingComputer,         │
│                     Dark Reading, Krebs on Security             │
│  • stocks_international → CNBC, Yahoo Finance, MarketWatch      │
│  • stocks_vietnam  → CafeF, VnEconomy, VnExpress Finance       │
│                                                                 │
│  Output: list of { url, title, description, published, source } │
│  Limit: 15 articles per category                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Background Thread 1: Title Translation                          │
│  news_service.py: _translation_worker()                         │
│                                                                 │
│  Queue: _translate_queue                                        │
│  Model: VinAI envit5-translation (135M params, local CPU)      │
│  Batch: 8 titles per inference call (OOM prevention)           │
│  Optimization: torch.jit.optimize_for_inference()              │
│  Thread count: TORCH_THREADS env var (default: cpu_count)      │
│                                                                 │
│  Only runs on EN-language articles (lang="en")                 │
│  VI articles (stocks_vietnam) skip this step                   │
│                                                                 │
│  Cache: data/translations/<category>.json                      │
│  { url_hash: { title_vi: "...", translated_at: "..." } }       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Background Thread 2: AI Tagging                                 │
│  news_service.py: _llama_worker()                               │
│                                                                 │
│  Queue: _llama_queue                                            │
│  Prompt: "Tag this article with 1-2 keywords. No explanation." │
│  Model: CloudLLMService (Open Claude → OpenRouter → LocalAI)   │
│                                                                 │
│  Example tags: Ransomware, Zero-Day, Pháp lý, Cổ tức,          │
│                DDoS, Blockchain, Lỗ hổng, CVE                  │
│                                                                 │
│  Tags stored in articles_history.json per article              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
              GET /api/news?category=cybersecurity
              Returns: articles with title_vi, tags, audio_cached
```

---

## 2. On-Demand Audio Pipeline (User-triggered)

```
User clicks 🔊 Play on an article card
        │
        ▼
[Frontend: togglePlay() in news/page.js]

Check audioData state (in-memory React state):
  ├── status = 'playing'?  → pause current Audio()
  ├── status = 'ready'?    → resume Audio()
  ├── status = 'loading'?  → do nothing (debounce)
  └── not in state?        → fetch from API
        │
        ▼
POST /api/news/summarize
{ url, title, lang }
        │
        ▼
[Backend: summary_service.py → _process_article_internal()]
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Cache Lookup                                            │
│  hash = MD5(url)                                                │
│  Check data/summaries/<hash>.json                              │
│  If found and not retryable error → return { audio_url,        │
│    summary_vi } immediately (0ms latency)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Cache miss
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Article Scraping (3-method fallback)                    │
│                                                                 │
│  Method 1 — requests + BeautifulSoup4:                         │
│    GET article URL with rotating User-Agent headers            │
│    Parse main content tags: article, main, .content, p         │
│    Filter noise paragraphs (< 50 chars, nav/footer text)       │
│    Deduplicate paragraphs                                       │
│    Cap at 12,000 characters                                     │
│                                                                 │
│  Method 2 — trafilatura (if Method 1 returns < 200 chars):     │
│    trafilatura.extract(html, include_comments=False)           │
│                                                                 │
│  Method 3 — newspaper3k (if both above fail):                  │
│    Article(url).download(); article.parse(); article.text      │
│                                                                 │
│  If all 3 fail → return { error: "...", retryable: True }     │
│  Backend raises HTTPException(500)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Got article text
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: AI Translation + Editorial Rewrite                      │
│  cloud_llm_service.py: chat_completion()                        │
│                                                                 │
│  3-tier fallback:                                               │
│  1. Open Claude (gemini-3-pro-preview)                         │
│     Multi-key round-robin from CLOUD_API_KEYS                  │
│     HTTP 429 → lock key 60s, try next key                      │
│  2. OpenRouter (all Cloud keys exhausted)                       │
│     Round-robin from OPENROUTER_API_KEYS                       │
│  3. LocalAI / Llama 3.1 (offline fallback)                     │
│     http://localai:8080/v1/chat/completions                    │
│     Timeout: INFERENCE_TIMEOUT (120s)                          │
│                                                                 │
│  Prompt enforces:                                               │
│  - Full editorial rewrite in broadcast-quality Vietnamese      │
│  - Preserve ALL: names, CVE codes, dates, statistics, URLs     │
│  - max_tokens: 16000 (no truncation on long articles)          │
│                                                                 │
│  If AI fails → return { error: "...", retryable: True }       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Pronunciation Normalization                             │
│  summary_service.py: _fix_pronunciation()                       │
│                                                                 │
│  Replaces technical abbreviations for TTS clarity:             │
│  DDoS → "Đi Đốt"                                               │
│  VPN → "V P N"                                                 │
│  SSL/TLS → "S S L / T L S"                                     │
│  ransomware → "ran-som-ware"                                    │
│  blockchain → "block-chain"                                     │
│  CVE-XXXX → "CVE năm X X X X"                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Text-to-Speech Generation                               │
│  edge_tts.Communicate(text, voice="vi-VN-HoaiMyNeural")        │
│  Async coroutine — saves MP3 to:                                │
│  data/summaries/audio/<hash>.mp3                               │
│                                                                 │
│  Served via: GET /api/news/audio/<hash>.mp3                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Persist JSON Cache                                      │
│  data/summaries/<hash>.json:                                   │
│  {                                                              │
│    "url": "...",                                                │
│    "summary_vi": "...",                                         │
│    "audio_url": "/api/news/audio/<hash>.mp3",                  │
│    "created_at": "2026-03-24T08:00:00Z",                       │
│    "retryable": false                                           │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
[Frontend receives { audio_url, summary_vi }]
  new Audio(audio_url) → .play()
  Summary text shown below article card
  audioData state updated: { status: 'playing', audioUrl, text }
  Article marked in History sidebar
```

---

## 3. Frontend Audio State Machine

```
Article audioData state:
  undefined → loading → ready → playing → paused
                              ↘ error
```

| State | Button appearance | Action on click |
|-------|------------------|-----------------|
| `undefined` | 🔊 Play | Fetch from API → loading |
| `loading` | ⏳ Loading... | Debounced (no action) |
| `ready` | ▶ Play (blue) | Resume Audio() |
| `playing` | ⏸ Pause (green) | Pause Audio() |
| `error` | ❌ Error text | Show error message |

The `audioData` state is stored in React `useState` (in-memory, not persisted across page refreshes). Article `audio_cached: true` from the API response indicates a cached MP3 exists on the server.

---

## 4. 7-Day Cache Lifecycle

```
data/summaries/
├─ <hash>.json    (created when article is first summarized)
└─ audio/
    └─ <hash>.mp3  (created alongside JSON)

Background cleanup worker (news_service.py):
  Runs on startup + periodically
  Reads all JSON files in data/summaries/
  Checks created_at field
  Deletes files older than 7 days
  Also removes orphaned MP3 files
```

**History sidebar** (`GET /api/news/history`):
- Returns all summaries created within the last 7 days
- Frontend groups by date and allows "Listen again" at 0ms latency (cache hit)
- Reprocess button (`POST /api/news/reprocess`) forces re-scrape + re-summarize, overwrites cache

---

## 5. Error Handling

| Error scenario | Backend response | Frontend display |
|---------------|-----------------|-----------------|
| Article scrape failed | HTTP 500, body: error text | "Không thể đọc nội dung bài báo" |
| AI API all keys exhausted | HTTP 500, body: error text | "Lỗi dịch vụ AI" |
| AI returns `{ error, retryable: true }` | HTTP 200, error field | Shown in summary box (red) |
| Edge-TTS failure | HTTP 500 | "Không thể tạo audio" |
| All fallbacks fail | HTTP 500 | Error message in card |

The frontend reads the actual error text from the response body (not a hardcoded message) so users see meaningful error details.
