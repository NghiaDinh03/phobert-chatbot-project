# context.md — Improvement Proposals & Session Log

> This document tracks improvement proposals based on thesis advisor feedback (Tô Nguyễn Nhật Quang, 2026-03-16), completed work sessions, and forward-looking proposals for SaaS scaling.

---

## Table of Contents

- [Session Log](#session-log)
- [1. Reduce theory, add algorithms](#1-reduce-theory-add-algorithms)
- [2. AI depth — Model comparison](#2-ai-depth--model-comparison)
- [3. No standardized dataset](#3-no-standardized-dataset)
- [4. Production architecture, User testing, Real enterprise data](#4-production-architecture-user-testing-real-enterprise-data)
- [Priority Summary](#priority-summary)
- [Improvement Proposals — Short-term](#improvement-proposals--short-term)
- [Improvement Proposals — SaaS Scaling](#improvement-proposals--saas-scaling)

---

## Session Log

### 2026-04-05 — Documentation Overhaul & Code Cleanup

#### 1. README Restructuring

| File | Change | Result |
|------|--------|--------|
| [`README.md`](README.md) | Slimmed from 684 → 155 lines | Numbered sections: Quick Start, Features (table), Architecture (mermaid), Env Variables (table), Docs links (table) |
| [`README_vi.md`](README_vi.md) | Slimmed from 896 → 155 lines | Same structure in Vietnamese, docs links route to `docs/vi/` where available |

#### 2. Backend Comment Cleanup

Stripped banner separators, tutorial comments, and section headers from 9 files (106 lines removed). 28 files were already clean and skipped. Zero functional changes — only comment/decoration removal.

| Modified File | Type of Removal |
|---------------|----------------|
| [`main.py`](backend/main.py) | Banner separators, section headers |
| [`iso27001.py`](backend/api/routes/iso27001.py) | Tutorial comments |
| [`metrics.py`](backend/api/routes/metrics.py) | Section headers |
| [`system.py`](backend/api/routes/system.py) | Banner separators |
| [`config.py`](backend/core/config.py) | Section headers |
| [`chat_service.py`](backend/services/chat_service.py) | Tutorial comments, banners |
| [`test_chat_service.py`](backend/tests/test_chat_service.py) | Section headers |
| [`test_iso27001_routes.py`](backend/tests/test_iso27001_routes.py) | Banner separators |
| [`test_rag_service.py`](backend/tests/test_rag_service.py) | Section headers |

#### 3. Algorithm Documentation

Created [`docs/en/algorithms.md`](docs/en/algorithms.md) — comprehensive doc covering 7 algorithms extracted from actual source code:

| # | Algorithm | Key Parameters |
|---|-----------|---------------|
| 1 | RAG Retrieval | ChromaDB cosine similarity, chunk_size=600, overlap=150, threshold=0.35 |
| 2 | Model Routing | Hybrid semantic+keyword, 68 intent templates, confidence threshold 0.6 |
| 3 | Weighted Compliance Scoring | critical=4, high=3, medium=2, low=1, tiers at 80/50/25% |
| 4 | Risk Register Scoring | Likelihood×Impact, 1–25 range, 3-retry LLM generation |
| 5 | Severity Normalization | 7B bias detection at >70% critical, redistribution to 25/25/30/20% |
| 6 | Input Safety Guard | 7 regex patterns, HTTP 400 rejection, special token stripping |
| 7 | Cloud LLM Fallback Chain | 5-model chain, 30s rate-limit cooldown, 3-mode assessment |

**Addresses advisor feedback:** Section 1 (replace theory with algorithms).

#### 4. Model Benchmark Document

Created [`docs/en/benchmark.md`](docs/en/benchmark.md) — comparison of 4 models:

| Model | Type | Purpose |
|-------|------|---------|
| Gemma 3n E4B | Ollama (local) | Security assessment |
| Llama 3.1 8B | LocalAI (local) | General chat |
| Gemini 3 Flash | Cloud API | Fast fallback |
| Gemini 3 Pro | Cloud API | High-quality fallback |

Includes test categories (Vietnamese quality, ISO 27001 knowledge, latency, throughput, resource usage, cost), reproducible curl commands, recommendation matrix, and decision flow diagram. Projected values marked with ᵖ superscript.

**Addresses advisor feedback:** Section 2 (model comparison depth).

#### 5. Enterprise Case Studies

Created [`docs/en/case_studies.md`](docs/en/case_studies.md) — 470-line research document:

| Aspect | Detail |
|--------|--------|
| Coverage | Real ISO 27001 / TCVN 11930 implementations |
| Sectors | Banking (5 case studies), Healthcare, Government, Technology |
| Sources | 30 cited sources with URLs |
| Key finding | 8/10 top Vietnamese banks certified, driven by SBV Circular 09/2020 |

**Addresses advisor feedback:** Section 4c (enterprise data / case study).

---

## 1. Reduce theory, add algorithms

> **Status: ✅ Documentation created** — [`docs/en/algorithms.md`](docs/en/algorithms.md) covers all 7 algorithms. Thesis report chapter still needs rewriting to incorporate this content.

### Current Problem

Thesis theory section is too long, presents general concepts (ISO 27001 definitions, ISMS history, AI overview) without connecting to the built system. Missing specific algorithm descriptions.

### Why It Matters

The thesis must demonstrate technical competence — algorithms and design decisions matter more than background theory. Examiners value students who **prove deep understanding** through precise algorithm descriptions.

### Proposed Solution

**A. Replace general theory with system-specific algorithm descriptions:**

| Algorithm | Source File | Technical Description |
|-----------|------------|----------------------|
| Header-aware Chunking | [`vector_store.py`](backend/repositories/vector_store.py:30) | Markdown heading-aware text segmentation (#, ##, ###), preserves hierarchical context. chunk_size=600, overlap=150, natural break detection avoids splitting tables/lists. |
| Multi-query Expansion | [`vector_store.py`](backend/repositories/vector_store.py:158) | Automatic query expansion: adds `tiêu chuẩn` prefix for "iso"/"tcvn" queries, synonym substitution (`đánh giá` → `kiểm toán`). Union search + dedup by `(source, chunk_index)`. |
| Hybrid Intent Classification | [`model_router.py`](backend/services/model_router.py:146) | 2-tier: (1) Semantic — ChromaDB cosine similarity on 60+ intent templates, (2) Keyword fallback — regex pattern matching 80+ ISO keywords + search. Threshold-based routing to security/general/search model. |
| Weighted Compliance Scoring | [`assessment_helpers.py`](backend/services/assessment_helpers.py:10) | Weights: critical=4, high=3, medium=2, low=1. Formula: `Score = Σ(w_i × implemented_i) / Σ(w_i) × 100%`. Risk: `R = L × I` (1–5 scale). |
| Severity Normalization | [`assessment_helpers.py`](backend/services/assessment_helpers.py:137) | Normalizes severity distribution when 7B model assigns >70% critical. Sorts by risk score descending, applies: 25% critical, 25% high, 30% medium, 20% low. |
| Anti-hallucination Filter | [`assessment_helpers.py`](backend/services/assessment_helpers.py:67) | Validates SecurityLLM JSON output: checks control IDs against known catalog, clamps values (likelihood 1–5, impact 1–5, risk 1–25), truncates text ≤200 chars/field. |
| API Key Round-robin + Cooldown | [`cloud_llm_service.py`](backend/services/cloud_llm_service.py:39) | Key rotation with 30s cooldown on 429. Fallback chain: 5 models × N keys = max 5N attempts. |

**B. Mathematical notation for thesis report:**

```
Cosine Similarity: sim(q, d) = (q · d) / (||q|| × ||d||)
  → ChromaDB stores distance = 1 - sim, system converts: score = 1 - distance
  → Confidence threshold: score ≥ 0.35 (equivalent to distance ≤ 0.65)

Weighted Compliance:
  W = Σ(w_i × c_i) / Σ(w_i) × 100%
  Where: w_i ∈ {4, 3, 2, 1} (critical/high/medium/low)
         c_i ∈ {0, 1} (not implemented / implemented)

Risk Score:
  R = L × I, L ∈ [1,5], I ∈ [1,5], R ∈ [1,25]
```

**Remaining effort:** 2–3 days to rewrite thesis theory chapter using [`algorithms.md`](docs/en/algorithms.md) as source.

---

## 2. AI depth — Model comparison

> **Status: ✅ Documentation created** — [`docs/en/benchmark.md`](docs/en/benchmark.md) has the comparison framework with projected values. Live benchmark testing still needed.

### Current Problem

Report lacks AI model performance comparison (LocalAI vs Ollama vs Cloud), no output quality measurements, no justification for model selection per task.

### Why It Matters

The project uses 6+ models but has no empirical data proving model choices are sound. Examiners will ask: *"Why SecurityLLM for GAP and not Llama? Why 8B and not 12B?"*

### Proposed Solution

**A. Model benchmark (framework ready, needs live data):**

| Experiment | Models | Metrics |
|-----------|--------|---------|
| GAP Analysis quality | SecurityLLM 7B vs Llama 8B vs gemini-3-flash | Precision/Recall on 20 ISO 27001 test cases |
| Response latency | LocalAI vs Ollama vs Cloud | P50, P95, P99 latency (from Prometheus histogram) |
| Token throughput | LocalAI (6 threads) vs Ollama | tokens/second on same prompt |
| JSON format compliance | SecurityLLM 7B | % valid JSON output (already logged) |
| Severity accuracy | SecurityLLM 7B | % correct severity vs expert annotation |
| RAG retrieval quality | ChromaDB cosine | Precision@5, Recall@5 on 30 ISO questions |

**B. Benchmark script needed:**

File: `scripts/benchmark_models.py`
- Input: 20–30 pairs (prompt, expected_output) from [`sample_training_pairs.jsonl`](data/knowledge_base/sample_training_pairs.jsonl)
- Run through each model endpoint
- Measure: latency, token count, JSON validity, severity match
- Output: markdown table + JSON results

**Remaining effort:** 3–5 days (write benchmark script + run + analyze + write report).

---

## 3. No standardized dataset

> **Status: ⏳ Not started**

### Current Problem

No standardized dataset for quality evaluation. [`sample_training_pairs.jsonl`](data/knowledge_base/sample_training_pairs.jsonl) is a small sample, insufficient for serious benchmarking. No ground truth for GAP analysis output.

### Why It Matters

No dataset = no objective quality evaluation. Technical examiners will require: *"How do you know the system evaluates correctly? What's the accuracy?"*

### Proposed Solution

**A. Build CyberAI Evaluation Dataset (high priority):**

| Dataset | Size | Content | Source |
|---------|------|---------|--------|
| RAG QA Pairs | 100 pairs | ISO/TCVN questions + expected answers + source docs | Self-created from 21 documents |
| GAP Analysis Ground Truth | 30 cases | Simulated systems (controls implemented) + expert-annotated gaps | ISO auditor reference |
| Intent Classification | 200 sentences | Message + expected intent (security/general/search) | Self-created + crowd-source |
| Prompt Injection | 50 sentences | Injection attempts + expected block/pass | OWASP LLM Top 10 |

**B. Proposed dataset structure:**

```
data/evaluation/
├── rag_qa_pairs.jsonl
├── gap_analysis_cases.jsonl
├── intent_classification.jsonl
├── prompt_injection.jsonl
└── README.md
```

**C. Evaluation pipeline:**

1. Run RAG QA → compute BLEU/ROUGE or cosine similarity with expected answers
2. Run GAP Analysis → compare severity + control IDs with ground truth
3. Run Intent Classification → compute accuracy, F1-score
4. Run Prompt Injection → compute True Positive Rate, False Positive Rate

**D. Tool support:**

[`dataset_generator.py`](backend/services/dataset_generator.py) can be extended to auto-generate QA pairs from 21 markdown documents, create GAP analysis test cases from [`controls.json`](data/knowledge_base/controls.json), and export standard JSONL format.

**Estimated effort:** 5–7 days (create 100+ entry dataset + write evaluation script + run + analyze).

---

## 4. Production architecture, User testing, Real enterprise data

> **Status: 🔶 Partially addressed** — Case studies created ([`case_studies.md`](docs/en/case_studies.md)). Production deployment and user testing remain.

### Current Problem

System runs in development mode (`docker-compose.yml`). Missing:
- Real production deployment with end-to-end monitoring
- User testing with real users (IT auditors, security officers)
- Real enterprise data (only simulated data used)

### Why It Matters

Thesis scores higher when proving the system **works in practice**, not just in a lab environment. User testing demonstrates real-world applicability.

### Proposed Solution

**A. Production Architecture (deployable — 2–3 days):**

Existing assets: `docker-compose.prod.yml` and [`nginx.conf`](nginx/nginx.conf).

| Item | Status | Action Needed |
|------|--------|--------------|
| Docker Compose production | ✅ Ready | Test on VPS |
| Nginx reverse proxy + TLS | ✅ Config exists | Deploy with Let's Encrypt |
| Prometheus metrics | ✅ Endpoint exists | Add `prometheus.yml` + Grafana dashboard |
| Health checks | ✅ 4 services | Configured in docker-compose |
| Resource limits | ✅ Set | Backend 6GB, LocalAI 12GB, Ollama 12GB |
| Backup strategy | ✅ [`backup.sh`](scripts/backup.sh) | Test restore procedure |
| Grafana dashboard | ❌ Missing | Create dashboard JSON for 5 metrics |
| Alert rules | ❌ Missing | Add Alertmanager rules (CPU >80%, RAM >90%) |
| CI/CD pipeline | ❌ Missing | GitHub Actions: lint + test + build + deploy |

**B. User Testing (5–7 days):**

| Step | Content | Deliverable |
|------|---------|-------------|
| 1 | Recruit 5–10 testers (IT staff, auditors, infosec students) | Tester list |
| 2 | Create test scenarios: 3 scenarios (chat, assessment, standard upload) | Test script document |
| 3 | Deploy to VPS, provide public URL | Production URL |
| 4 | Collect feedback: SUS (System Usability Scale) questionnaire | SUS score (target ≥ 68) |
| 5 | Measure real metrics: response time, error rate, completion rate | Performance report |
| 6 | Analyze + write User Testing chapter in thesis | 5–8 pages |

**C. Real Enterprise Data (alternatives):**

| Approach | Feasibility | Description |
|----------|-------------|-------------|
| Anonymized real company data | Medium | Contact IT firms for anonymized data |
| High-quality simulated data | High | Create 5 detailed company profiles + assessment results |
| Public case studies | ✅ Done | [`case_studies.md`](docs/en/case_studies.md) — 30 cited sources |
| Lab environment simulation | High | Set up lab (10 VMs, AD, firewall) → real assessment |

**Remaining effort:** 8–12 days for production deployment + user testing.

---

## Priority Summary

| # | Proposal | Difficulty | Time | Impact | Status |
|---|----------|-----------|------|--------|--------|
| 1 | Rewrite theory chapter → algorithms | Low | 2–3 days | ⭐⭐⭐⭐ High | ✅ Doc created, thesis chapter pending |
| 2 | Model comparison benchmark | Medium | 3–5 days | ⭐⭐⭐⭐⭐ Very high | ✅ Doc created, live data pending |
| 3 | Build evaluation dataset | Medium | 5–7 days | ⭐⭐⭐⭐⭐ Very high | ⏳ Not started |
| 4a | Production deployment + Grafana | Low | 2–3 days | ⭐⭐⭐ Medium | ⏳ Not started |
| 4b | User testing (5+ people) | Medium | 5–7 days | ⭐⭐⭐⭐⭐ Very high | ⏳ Not started |
| 4c | Enterprise data / case study | High | 3–5 days | ⭐⭐⭐ Medium | ✅ Done |

**Recommended execution order:** 3 → 4b → 4a → 2 (live data) → 1 (thesis rewrite)

---

## Improvement Proposals — Short-term

> Next sprint priorities following the 2026-04-05 session.

| # | Proposal | Description | Effort |
|---|----------|-------------|--------|
| 1 | Live benchmark testing | Run actual curl tests against deployed models, replace projected values in [`benchmark.md`](docs/en/benchmark.md) with measured data | 2–3 days |
| 2 | Vietnamese translations for new docs | Create `docs/vi/algorithms.md`, `docs/vi/benchmark.md`, `docs/vi/case_studies.md` | 1–2 days |
| 3 | Frontend case studies page | New `/case-studies` route displaying research findings from [`case_studies.md`](docs/en/case_studies.md) | 2–3 days |
| 4 | Assessment template expansion | Add banking-specific (SBV Circular 09/2020) and healthcare templates to [`controls_catalog.py`](backend/services/controls_catalog.py) | 2–3 days |
| 5 | Unit test coverage | Tests for [`assessment_helpers.py`](backend/services/assessment_helpers.py), [`model_router.py`](backend/services/model_router.py), [`controls_catalog.py`](backend/services/controls_catalog.py) | 3–4 days |

---

## Improvement Proposals — SaaS Scaling

> Medium-term roadmap for evolving the platform from thesis project to production SaaS.

| # | Proposal | Description | Complexity |
|---|----------|-------------|-----------|
| 1 | Multi-tenancy | Tenant isolation in ChromaDB (separate collections per org), JWT claims for tenant routing | High |
| 2 | PostgreSQL migration | Replace file-based assessment storage ([`data/assessments/`](data/assessments)) with PostgreSQL for concurrent access | Medium |
| 3 | Authentication service | OAuth2/OIDC integration (Keycloak or Auth0), role-based access (auditor/admin/viewer) | High |
| 4 | API rate limiting per tenant | Tiered plans (free/pro/enterprise) with different rate limits via [`limiter.py`](backend/core/limiter.py) | Medium |
| 5 | Assessment versioning | Git-like version history for assessments, diff view between versions | Medium |
| 6 | Webhook notifications | Notify external systems on assessment completion, compliance threshold alerts | Low |
| 7 | Export formats | PDF report generation, Excel/CSV export, SIEM integration (CEF/LEEF format) | Medium |
| 8 | Horizontal scaling | Kubernetes deployment with HPA, Redis for session/cache, load balancer health checks | High |
| 9 | Billing integration | Stripe/payment gateway, usage-based billing for cloud model API calls | High |
| 10 | Compliance dashboard | Real-time compliance posture across multiple standards, trend analysis | Medium |
