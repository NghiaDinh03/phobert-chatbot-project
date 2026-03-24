# AI Chatbot (RAG) — Mechanism Flow

The **AI Chatbot** feature is a Retrieval-Augmented Generation (RAG) system specialized for information security, ISO 27001:2022 compliance, and Vietnamese cybersecurity law (TCVN 11930:2017). It combines a local vector database (ChromaDB) with cloud-first LLM inference and persistent session memory.

---

## 1. Complete RAG Flow

```
User types message in /chatbot page
        │
        ▼
[Frontend: send() in chatbot/page.js]
  POST /api/chat
  { message: "...", session_id: "uuid-stored-in-localStorage" }
        │
        ▼
[Backend: chat_service.py: generate_response()]
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Load Session Memory                                     │
│  session_store.py: load_session(session_id)                     │
│  File: data/sessions/<session_id>.json                         │
│  Structure: [{ role, content, timestamp }, ...]                │
│  Keep: last 20 messages (sliding window)                        │
│  TTL: 24 hours from last_accessed                              │
│  If no file → start fresh session                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Route Classification                                    │
│  model_router.py: classify(message)                             │
│                                                                 │
│  Algorithm: keyword-weighted scoring across 7 categories        │
│  Categories and trigger keywords:                               │
│  • iso      → "iso 27001", "annex", "kiểm soát", "controls"   │
│  • security → "firewall", "ransomware", "vulnerability", "CVE" │
│  • legal    → "tcvn", "luật", "nghị định", "quy định"         │
│  • technical → "server", "network", "cấu hình", "deploy"      │
│  • news     → "tin tức", "báo", "hôm nay", "mới nhất"        │
│  • greeting → "xin chào", "hello", "hi", "cảm ơn"            │
│  • general  → (default fallback)                               │
│                                                                 │
│  Each category loads a different system prompt template         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: RAG Context Retrieval                                   │
│  rag_service.py: retrieve_with_sources(message)                 │
│                                                                 │
│  3a. Embed the user message:                                    │
│      all-MiniLM-L6-v2 → 384-dimensional vector                 │
│                                                                 │
│  3b. Multi-query expansion:                                     │
│      Generate Vietnamese query variations to improve recall     │
│      e.g. "kiểm soát truy cập" → also queries "access control" │
│                                                                 │
│  3c. ChromaDB cosine similarity search:                         │
│      collection.query(query_embeddings, n_results=3)           │
│      Returns top-3 chunks with source filename + score         │
│                                                                 │
│  3d. Relevance threshold check:                                 │
│      is_relevant(score) → if all scores < threshold,           │
│      skip RAG and answer from general knowledge                 │
│                                                                 │
│  Knowledge base files in data/iso_documents/:                  │
│  • iso27001_annex_a.md        (93 controls)                    │
│  • tcvn_11930_2017.md         (Vietnamese standard)            │
│  • luat_an_ninh_mang_2018.md  (Cybersecurity Law 2018)         │
│  • nghi_dinh_13_2023_bvdlcn.md (Data Protection Decree)       │
│  • network_infrastructure.md  (Network security guidance)      │
│  • assessment_criteria.md     (Scoring criteria)               │
│  • checklist_danh_gia_he_thong.md (Audit checklist)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Build LLM Messages Array                                │
│  chat_service.py: _build_messages()                             │
│                                                                 │
│  [                                                              │
│    { role: "system", content: <route-specific system prompt> } │
│    { role: "system", content: <RAG context chunks> }           │
│    ...session history (last 20 messages)...                     │
│    { role: "user", content: <current message> }                │
│  ]                                                              │
│                                                                 │
│  System prompt instructs LLM to:                               │
│  - Answer based on provided RAG context                         │
│  - Cite sources (e.g. "Theo Phụ lục A.9 của ISO 27001...")    │
│  - Respond in Vietnamese                                        │
│  - Acknowledge when context is insufficient                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Cloud LLM Call (3-tier fallback)                        │
│  cloud_llm_service.py: chat_completion()                        │
│                                                                 │
│  Priority 1: Open Claude (gemini-3-pro-preview)                │
│    Round-robin across CLOUD_API_KEYS list                      │
│    429 → key cooldown 60s → next key                           │
│    Timeout: CLOUD_TIMEOUT (60s)                                │
│                                                                 │
│  Priority 2: OpenRouter                                         │
│    Activated if all Cloud keys fail or exhausted               │
│    Round-robin across OPENROUTER_API_KEYS                      │
│                                                                 │
│  Priority 3: LocalAI (http://localai:8080)                     │
│    Llama 3.1 70B Instruct Q4_K_M (on-premise)                  │
│    Timeout: INFERENCE_TIMEOUT (120s)                           │
│    Activated only when all cloud providers fail                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Save Session + Respond                                  │
│  Append { role: "user", content, timestamp }                   │
│  Append { role: "assistant", content, timestamp }              │
│  Trim to last 20 messages                                       │
│  Save to data/sessions/<session_id>.json                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
[Frontend receives response]
  Renders markdown with react-markdown + remark-gfm
  Sources listed below response
  Session sidebar updated with new message count
```

---

## 2. Knowledge Base Documents

| File | Content | Controls / Sections |
|------|---------|-------------------|
| `iso27001_annex_a.md` | ISO 27001:2022 Annex A controls | 93 controls |
| `tcvn_11930_2017.md` | TCVN 11930:2017 levels 1–5 | 5 levels |
| `luat_an_ninh_mang_2018.md` | Vietnamese Cybersecurity Law 2018 | Key articles |
| `nghi_dinh_13_2023_bvdlcn.md` | Personal Data Protection Decree 13/2023 | Key articles |
| `network_infrastructure.md` | Network security guidance | Best practices |
| `assessment_criteria.md` | Assessment scoring criteria | Scoring rubric |
| `checklist_danh_gia_he_thong.md` | System audit checklist | Checklist items |

To add more documents: copy `.md` files to `data/iso_documents/` then click **🔄 Reload** on the Analytics page. See [ChromaDB Guide](./chromadb_guide.md) for details.

---

## 3. Session Memory Model

```
data/sessions/<uuid>.json:
{
  "session_id": "abc-123",
  "messages": [
    { "role": "user", "content": "...", "timestamp": "..." },
    { "role": "assistant", "content": "...", "timestamp": "..." },
    ...
  ],
  "created_at": "...",
  "last_accessed": "..."
}
```

- **Max messages kept:** 20 (older messages are trimmed, keeping latest)
- **TTL:** 24 hours from `last_accessed` — auto-deleted by background cleanup
- **Frontend storage:** `session_id` UUID stored in `localStorage`
- **Multiple sessions:** each browser tab/window gets its own session; user can rename/delete sessions in the sidebar

---

## 4. Route-Specific System Prompts

Each detected route loads a specialized system prompt:

| Route | System prompt focus |
|-------|-------------------|
| `iso` | ISO 27001:2022 expert, cite Annex A control numbers |
| `security` | Cybersecurity analyst, CVE analysis, risk scoring |
| `legal` | Vietnamese law expert, cite law article numbers |
| `technical` | Infrastructure architect, practical technical advice |
| `news` | News analyst, summarize and contextualize current events |
| `greeting` | Friendly assistant introduction |
| `general` | General AI assistant with security focus |

---

## 5. Frontend Chat Architecture

```
chatbot/page.js
│
├─ State: messages[], sessions[], currentSessionId
├─ localStorage: sessions list, pending message recovery
│
├─ send() function:
│   1. Optimistic UI: add user message immediately
│   2. Save pending message (crash recovery)
│   3. POST /api/chat
│   4. Add bot response to messages[]
│   5. Update session sidebar
│
├─ Session sidebar:
│   - List all sessions from localStorage
│   - New chat / rename / delete
│   - Click to switch session (loads history)
│
└─ Suggestions bar:
    Quick-start prompts for ISO 27001 questions
```

**Crash recovery:** If the browser crashes mid-request, a `PENDING_KEY` in localStorage stores the unsent message. On next load, the frontend detects this and offers to resend or discard.
