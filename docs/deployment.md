# Deployment Guide — CyberAI Assessment Platform v2.0

---

## 1. System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04, Windows WSL2 | Ubuntu 22.04 LTS |
| RAM | 16 GB | 32 GB |
| Disk | 40 GB free | 80 GB SSD |
| CPU | 4 cores | 8+ cores |
| GPU | None (CPU inference) | NVIDIA CUDA (for LocalAI) |
| Docker | Engine 24+ | Latest stable |
| Docker Compose | v2.20+ | Latest stable |

**Why so much RAM?**
- LocalAI with Llama 3.1 70B Q4_K_M: ~38 GB RAM (use 8B model for <16 GB machines)
- FastAPI backend (VinAI Translate loaded): ~2–4 GB RAM
- Next.js frontend: ~500 MB RAM
- ChromaDB + embeddings model: ~1 GB RAM

---

## 2. Setup Steps

### Step 1: Clone the repository
```bash
git clone https://github.com/NghiaDinh03/phobert-chatbot-project.git
cd phobert-chatbot-project
```

### Step 2: Create the environment file
```bash
cp .env.example .env
```

Open `.env` and configure:

```env
# ─── Required: Cloud LLM (at least one key) ───────────────────────
CLOUD_API_KEYS=your_key_1,your_key_2,your_key_3
CLOUD_LLM_API_URL=https://open-claude.com/v1
CLOUD_MODEL_NAME=gemini-3-pro-preview

# ─── Optional: OpenRouter fallback ────────────────────────────────
OPENROUTER_API_KEYS=your_openrouter_key_1,your_openrouter_key_2

# ─── Security ─────────────────────────────────────────────────────
JWT_SECRET=change-this-to-a-random-secret
CORS_ORIGINS=http://localhost:3000

# ─── Performance tuning ───────────────────────────────────────────
TORCH_THREADS=4
MAX_CONCURRENT_REQUESTS=3
INFERENCE_TIMEOUT=120
CLOUD_TIMEOUT=60

# ─── LocalAI model (change to 8B for low-RAM machines) ────────────
MODEL_NAME=Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf
SECURITY_MODEL_NAME=SecurityLLM-7B-Q4_K_M.gguf
```

> **Tip:** Add multiple API keys separated by commas. The system uses round-robin rotation across all keys, with 60-second cooldown when a key hits rate limits.

### Step 3: Build and start all containers
```bash
docker-compose up --build -d
```

This command will:
1. Build the `phobert-frontend` image (Next.js 15, ~800 MB)
2. Build the `phobert-backend` image (Python 3.11 + all dependencies, ~2 GB)
3. Pull the `phobert-localai` image (LocalAI server)
4. Download GGUF model files into `./models/` (~15–40 GB depending on models selected)
5. Start all containers on `phobert-network`
6. Mount `./data:/data` volume for persistent storage

**First run time:** 15–45 minutes (model downloads). Subsequent starts: < 30 seconds.

### Step 4: Verify startup
```bash
# Watch backend logs for startup confirmation
docker logs phobert-backend -f

# Expected output:
# [INFO] Settings validated: 2 cloud API keys loaded
# [INFO] ChromaDB loaded: 342 chunks from 7 documents
# [INFO] VinAI Translate model: loading...
# [INFO] VinAI Translate model: ready
# [INFO] Starting background workers...
# [INFO] FastAPI started on 0.0.0.0:8000
```

### Step 5: Access the application

Open your browser: **http://localhost:3000**

---

## 3. Docker Compose Services

```yaml
services:
  frontend:      # Next.js 15
    port: 3000
    memory: 2 GB
    depends_on: backend

  backend:       # FastAPI Python 3.11
    port: 8000
    memory: 6 GB
    volumes: ./data:/data

  localai:       # LocalAI GGUF inference server
    port: 8080
    memory: 12 GB
    volumes: ./models:/models
```

All services communicate via `phobert-network` (bridge). Only ports 3000 (frontend) is exposed to the host by default.

---

## 4. Health Checks

```bash
# Check all container statuses
docker-compose ps

# Backend health endpoint
curl http://localhost:8000/

# View backend logs (live)
docker logs phobert-backend -f

# View LocalAI logs
docker logs phobert-localai -f

# Check frontend build
docker logs phobert-frontend -f
```

Expected backend response: `{"status": "ok", "version": "2.0.0"}`

---

## 5. Persistent Data Structure

All data persists in `./data/` on the host machine. Containers can be destroyed and rebuilt without losing:

```
data/
├─ iso_documents/     ← Your .md knowledge base (never auto-deleted)
├─ vector_store/      ← ChromaDB SQLite files (rebuilt on reindex)
├─ summaries/         ← Article JSON cache (7-day TTL)
│   └─ audio/         ← Generated MP3 files (7-day TTL)
├─ sessions/          ← Chat session files (24-hour TTL)
├─ translations/      ← Title translation cache
├─ knowledge_base/    ← Static JSON for ISO controls (never auto-deleted)
└─ assessments/       ← ISO assessment reports (never auto-deleted)
```

---

## 6. Low-RAM Configuration (< 16 GB)

Switch to the smaller Llama 3.1 8B model in `.env`:
```env
MODEL_NAME=Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
```

Also reduce memory limits in `docker-compose.yml`:
```yaml
localai:
  mem_limit: 8g   # reduced from 12g
backend:
  mem_limit: 4g   # reduced from 6g
```

Performance trade-off: 8B model is faster but produces lower-quality Vietnamese reports and ISO analysis.

---

## 7. Production Deployment

For production use, add a reverse proxy (Nginx/Caddy) in front of the Next.js container:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Also update your `.env`:
```env
CORS_ORIGINS=https://yourdomain.com
JWT_SECRET=<strong-random-secret>
```

**Important:** Never expose ports 8000 (backend) or 8080 (LocalAI) directly to the internet. All external traffic must go through the Next.js reverse proxy at port 3000.

---

## 8. Update Procedure

```bash
# Pull latest code
git pull origin main

# Rebuild and restart (data is preserved in ./data volume)
docker-compose down
docker-compose up --build -d

# Reindex ChromaDB if iso_documents were updated
# (via Analytics page or API call)
curl -X POST http://localhost:8000/api/iso27001/chromadb/reload
```

---

## 9. Backup & Restore

**Backup critical data:**
```bash
# Backup assessments, sessions, and knowledge base
tar -czf backup-$(date +%Y%m%d).tar.gz \
    data/assessments/ \
    data/iso_documents/ \
    data/knowledge_base/ \
    data/sessions/
```

**Restore:**
```bash
tar -xzf backup-20260324.tar.gz
# Then reindex ChromaDB from Analytics page
```

Audio files and translation caches do not need backup — they will be regenerated on demand.
