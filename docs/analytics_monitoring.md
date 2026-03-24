# Analytics & Monitoring Dashboard — Feature Guide

The **Analytics** page (`/analytics`) is the administrative control center for the entire platform. It provides real-time system health monitoring, AI service status, storage management, ChromaDB vector store control, and assessment history management.

---

## 1. System Hardware Monitor

```
[Frontend: SystemStats.js component]
  Poll: GET /api/system/stats (every 5 seconds)
        │
        ▼
  Display cards:
  ┌─────────────────────────────────────────────────────────┐
  │ CPU Usage     │ 23%  [████░░░░░░░░] green               │
  │ RAM Usage     │ 61%  [████████░░░░] yellow               │
  │ Disk Usage    │ 44%  [█████░░░░░░░] green                │
  │ System Uptime │ 2d 4h 12m                               │
  └─────────────────────────────────────────────────────────┘

  Color thresholds (getColor utility):
  • < 50%  → green  (var(--accent-green))
  • 50–79% → yellow (var(--accent-yellow))
  • ≥ 80%  → red    (var(--accent-red))
```

**Response from `/api/system/stats`:**
```json
{
  "cpu_percent": 23.5,
  "ram_percent": 61.2,
  "ram_used_gb": 9.8,
  "ram_total_gb": 16.0,
  "disk_percent": 44.0,
  "uptime_seconds": 187320
}
```

---

## 2. AI Service Status Monitor

```
GET /api/system/ai-status
        │
        ▼
  Service status indicators:
  ┌─────────────────────────────────────────────────────────┐
  │ 🟢 Open Claude (Cloud LLM)  │ ok / degraded / offline  │
  │ 🟢 OpenRouter               │ ok / no_keys / offline   │
  │ 🟢 LocalAI                  │ ok / loading / offline   │
  │ 🟢 ChromaDB                 │ ok / error               │
  │ 🟢 VinAI Translate          │ loaded / loading         │
  │ 🟡 Edge-TTS                 │ available / unavailable  │
  └─────────────────────────────────────────────────────────┘

  News pipeline status:
  GET /api/news/ai-status
  → "idle" / "translating" / "summarizing" / "generating_audio"
```

---

## 3. Cache & Storage Statistics

```
GET /api/system/cache-stats
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 📄 Translation cache files  │  3 JSON files            │
  │ 📝 Summary cache files      │  67 JSON files           │
  │ 🎵 Audio MP3 files          │  67 MP3 files            │
  │ 💾 Total storage used       │  142.3 MB                │
  └─────────────────────────────────────────────────────────┘

  Storage locations:
  • data/translations/*.json   → title translation cache
  • data/summaries/*.json      → article summary cache
  • data/summaries/audio/*.mp3 → generated MP3 files

  Auto-cleanup: files older than 7 days are deleted by
  the background worker in news_service.py
```

**Actions available:**
- **🗑 Clear all cache**: `POST /api/news/clear-cache` — deletes all summary JSON and MP3 files

---

## 4. ChromaDB Vector Store Panel

```
GET /api/iso27001/chromadb/stats
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ Collection:       iso_knowledge                         │
  │ Total documents:  7 files                               │
  │ Total chunks:     342 vectors                           │
  │ Distance metric:  cosine                                │
  │ Store path:       /data/vector_store                    │
  └─────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────┐
  │ 🔍 Test Search                                         │
  │  Input: "phòng chống ransomware"   [Enter to search]  │
  │                                                        │
  │  POST /api/iso27001/chromadb/search                   │
  │  { query: "phòng chống ransomware", n_results: 3 }    │
  │                                                        │
  │  Result cards:                                         │
  │  ┌──────────────────────────────────────────────────┐ │
  │  │ Score: 87%  │ Source: iso27001_annex_a.md        │ │
  │  │ "Tổ chức phải đảm bảo có biện pháp bảo vệ..."   │ │
  │  └──────────────────────────────────────────────────┘ │
  └────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────┐
  │ 🔄 Reload / Reindex              │
  │  POST /api/iso27001/chromadb/reload                    │
  │  → Drops existing collection                           │
  │  → Scans data/iso_documents/*.md                      │
  │  → Chunks all files (header-aware, 500 chars)         │
  │  → Embeds with all-MiniLM-L6-v2                       │
  │  → Stores in ChromaDB SQLite                          │
  │  → Returns: { chunks_loaded: 342, documents: 7 }     │
  └──────────────────────────────────┘
```

**When to reindex:** After adding or modifying any `.md` file in `data/iso_documents/`. See [ChromaDB Guide](./chromadb_guide.md) for the full workflow.

---

## 5. ISO Assessment History Table

```
GET /api/iso27001/history
        │
        ▼
  ┌────────────────────────────────────────────────────────────────┐
  │ Date       │ Standard        │ Organization  │ Risk  │ Score │
  ├────────────────────────────────────────────────────────────────┤
  │ 2026-03-24 │ ISO 27001:2022  │ Công ty ABC   │ HIGH  │ 50.5% │
  │ 2026-03-20 │ TCVN 11930:2017 │ Bệnh viện XYZ │ MED   │ 72.0% │
  └────────────────────────────────────────────────────────────────┘

  Row actions:
  ├── 👁 View    → modal with full markdown report
  ├── ♻ Reuse   → navigate to /form-iso with pre-filled data
  └── 🗑 Delete  → confirm popup
                   Option: "Don't ask again for 24 hours"
                   (stored in localStorage: suppress_delete_warning)
```

**Delete warning suppression:**
The "don't ask again" flag is stored in `localStorage` with a 24-hour expiry. This is designed for admins who frequently delete test data and don't want repeated confirmation dialogs.

---

## 6. Frontend Architecture

```
analytics/page.js
│
├─ useEffect: fetchData() on mount
│   ├── GET /api/iso27001/history
│   ├── GET /api/system/cache-stats
│   └── GET /api/iso27001/chromadb/stats
│
├─ useEffect: (separate) system stats polling
│   └── GET /api/system/stats every 5s (via SystemStats.js)
│
├─ openDetail(id): GET /api/iso27001/history/{id}
│   → setSelectedAssessment(data)
│   → show modal
│
├─ handleReuse(): navigate to /form-iso
│   → passes formData via URL state or sessionStorage
│
├─ checkDeleteWarning(id): check localStorage suppression
│   → if suppressed: executeDelete(id) directly
│   → else: show confirm dialog
│
└─ executeDelete(id): DELETE /api/iso27001/history/{id}
    → refresh history list
```
