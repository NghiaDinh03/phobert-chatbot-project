# Local Models API Guide (English)

> **Translation pending.** Full reference is currently maintained in Vietnamese — see [`docs/vi/local_models_api.md`](../vi/local_models_api.md). This English stub captures the high-level surface so non-VI readers can wire integrations without reading the full VI doc.

---

## 1. Architecture overview

```
┌──────────────────┐        HTTP/JSON       ┌──────────────────┐
│ Client (n8n /    │ ─────────────────────▶ │ Server           │
│ curl / Python)   │                        │  - Backend :8000 │
│                  │ ◀───────────────────── │  - Ollama  :11434│
└──────────────────┘      Response          └──────────────────┘
```

Two ways to invoke a local model from a remote machine:

| # | Endpoint | Description | Recommendation |
|---|----------|-------------|----------------|
| **A** | `POST http://<SERVER_IP>:8000/api/chat` | Through Backend — adds RAG, log-analysis prompt, automatic verdict | ✅ Recommended for log analysis |
| **B** | `POST http://<SERVER_IP>:11434/v1/chat/completions` | Direct to Ollama — raw LLM, no analysis prompt | When you need full prompt control |

## 2. Available local models

Check pulled models:

```bash
curl http://<SERVER_IP>:11434/api/tags
```

| Model ID | Size | Use case | Throughput (2 CPU / 12 GB RAM) |
|---|---|---|---|
| `gemma4:latest` | 9.6 GB | Not recommended on this server — too slow | ~0.8 tok/s |
| `gemma3n:e4b` | 7.5 GB | Mid-tier log analysis | ~2–3 tok/s |
| `gemma3n:e2b` | 5.6 GB | **Recommended** — fast log analysis on weak CPU | ~5–7 tok/s |

## 3. Method A — Backend `/api/chat`

**Request body**

```json
{
  "message": "<log content + question>",
  "session_id": "n8n-log-analyzer-001",
  "model": "gemma4:latest",
  "prefer_cloud": false
}
```

> ⚠️ You **must** send `"prefer_cloud": false` to use a local model; otherwise the backend routes to a cloud provider and ignores `model`.

**Response body** (abbreviated)

```json
{
  "response": "### 1. Event info ...\n### 2. Verdict ...",
  "model": "gemma4:latest",
  "tokens": { "prompt_tokens": 1234, "completion_tokens": 567, "total_tokens": 1801 },
  "route": "ollama",
  "rag_used": false
}
```

The backend automatically applies the **Log Analysis Prompt** when it detects log-shaped input and returns a 4-section markdown structure (Event info / Verdict / MITRE ATT&CK / Recommendations).

## 4. Method B — Direct Ollama (OpenAI-compatible)

```bash
curl -X POST http://<SERVER_IP>:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  --max-time 600 \
  -d '{
    "model": "gemma4:latest",
    "messages": [
      { "role": "system", "content": "You are a SOC analyst..." },
      { "role": "user",   "content": "Event ID: 4688\\nProcess: cmd.exe" }
    ],
    "temperature": 0.3,
    "max_tokens": 2048
  }'
```

> ⚠️ With Gemma 4 (thinking mode), the answer may live in `choices[0].message.reasoning` instead of `.content`. Code must check both:
>
> ```python
> msg = data["choices"][0]["message"]
> text = msg.get("content") or msg.get("reasoning") or ""
> ```

## 5. When to use local vs cloud

| Scenario | Local (Gemma) | Cloud |
|---|---|---|
| Sensitive logs (no external transmission) | ✅ Required | ❌ |
| Simple log, need throughput | `gemma3n:e2b` | ✅ |
| Complex log, need accuracy | Gemma 4 | ✅ |
| No internet | ✅ Required | ❌ |
| Batch 1000+ logs/day | ✅ (no API cost) | $$$ |

## 6. Common errors

| Symptom | Cause | Fix |
|---|---|---|
| Timeout on first call | Gemma 4 loading 9.4 GB into RAM | Set client timeout ≥ 900 s |
| Empty `content` | Gemma 4 returned `reasoning` instead | Check both fields |
| `LocalAI unavailable` | `prefer_cloud=true` while requesting local | Send `"prefer_cloud": false` |
| `model not found` | Ollama hasn't pulled it | `docker exec phobert-ollama ollama pull <model>` |

---

For the full Vietnamese reference (n8n examples, regex extraction, monitoring commands, etc.) see [`docs/vi/local_models_api.md`](../vi/local_models_api.md).
