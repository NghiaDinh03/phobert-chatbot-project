# ISO 27001 Assessment Form — Mechanism Flow

The Assessment Form is the core analytical feature of the platform. It automates what would traditionally require weeks of manual auditing by using a **two-phase AI pipeline**: a security-specialized LLM for gap detection, followed by a general LLM for structured report generation.

---

## 1. Multi-Step Form Flow

```
[Frontend: /form-iso]

Step 1: Select Standard
  ├── ISO 27001:2022 (93 Annex A controls)
  └── TCVN 11930:2017 (5 security levels)

Step 2: Organization Profile
  ├── Name, industry (finance/healthcare/tech/...)
  ├── Size (small/medium/large/enterprise)
  └── Primary business function

Step 3: Infrastructure Details
  ├── Server environment (on-premise/cloud/hybrid)
  ├── Cloud provider (AWS/Azure/GCP/none)
  ├── Security controls: Firewall, IDS/IPS, VPN, WAF,
  │   SIEM, DLP, MFA, EDR (Yes/No/Partial)
  └── Network topology description

Step 4: Policy & Control Checkboxes
  ├── Grouped by ISO 27001 Annex A category (A.5 → A.8)
  │   or TCVN 11930 level requirements
  ├── Each control: Yes / No / Partial
  ├── "Select all in category" toggle
  └── Templates: load pre-filled profiles
       (Banking, Hospital, SaaS, Government)

Step 5: Submit → POST /api/iso27001/assess
```

---

## 2. Backend Assessment Pipeline

```
POST /api/iso27001/assess
{ standard_id, organization, infrastructure, controls }
        │
        ▼
[Backend: iso27001_service.py]
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: RAG Context Retrieval                                  │
│                                                                 │
│  rag_service.py: retrieve_with_sources(assessment_text)         │
│  Embed the form data summary as a query                         │
│  ChromaDB cosine search → top-5 relevant document chunks       │
│                                                                 │
│  Sources used:                                                  │
│  • iso27001_annex_a.md     ← control descriptions              │
│  • assessment_criteria.md  ← scoring criteria                  │
│  • tcvn_11930_2017.md      ← for TCVN assessments              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Gap Analysis (Security-specialized LLM)                │
│                                                                 │
│  cloud_llm_service.py with security-focused system prompt      │
│  (or LocalAI SecurityLLM 7B if cloud unavailable)              │
│                                                                 │
│  Input to LLM:                                                  │
│  - Organization profile (JSON)                                  │
│  - Infrastructure details (JSON)                                │
│  - Control responses (JSON: control_id → yes/no/partial)       │
│  - RAG context from relevant ISO/TCVN document chunks          │
│                                                                 │
│  LLM tasks:                                                     │
│  - Identify missing controls (gap analysis)                    │
│  - Identify partial controls that need improvement             │
│  - Detect configuration risks from infrastructure data         │
│  - Assign risk severity: Critical / High / Medium / Low        │
│  - Map each gap to its ISO 27001 control number                │
│                                                                 │
│  Output: raw gap list (bullet points, dry technical format)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Report Generation (General LLM)                        │
│                                                                 │
│  cloud_llm_service.py with report-writer system prompt         │
│  (or LocalAI Llama 3.1 70B if cloud unavailable)              │
│                                                                 │
│  Input to LLM:                                                  │
│  - Gap analysis from Phase 2                                    │
│  - Organization context                                         │
│  - Standard being assessed                                      │
│                                                                 │
│  LLM tasks:                                                     │
│  - Translate and contextualize the raw gap findings            │
│  - Format as professional Vietnamese markdown report           │
│  - For each gap: explain WHY it violates the standard          │
│  - Generate prioritized Action Plan with specific steps        │
│  - Assign overall compliance percentage                         │
│  - Include executive summary                                    │
│                                                                 │
│  Output: formatted markdown report in Vietnamese               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Persist Assessment Record                                       │
│  data/assessments/<id>.json:                                   │
│  {                                                              │
│    "id": "assess-20260324-xyz",                                │
│    "standard": "ISO 27001:2022",                               │
│    "organization": { ... },                                     │
│    "controls": { "A.5.1": "yes", ... },                        │
│    "risk_level": "high",                                        │
│    "compliance_percent": 50.5,                                  │
│    "report_markdown": "## Báo cáo ...",                        │
│    "created_at": "2026-03-24T08:00:00Z"                        │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
[Frontend: /form-iso result view]
  Risk level badge (color-coded)
  Compliance percentage gauge
  Full markdown report (react-markdown)
  Download / Print button
  "View in Analytics" link
```

---

## 3. Supported Standards

### ISO 27001:2022

```
Controls structure (from data/knowledge_base/iso27001.json):
  A.5  — Organizational controls (37 controls)
  A.6  — People controls (8 controls)
  A.7  — Physical controls (14 controls)
  A.8  — Technological controls (34 controls)
  Total: 93 controls
```

Scoring: `compliance_percent = (yes + 0.5 × partial) / total_controls × 100`

### TCVN 11930:2017

```
5-level classification (from data/knowledge_base/tcvn14423.json):
  Level 1 — Basic requirements (min security)
  Level 2 — Standard requirements
  Level 3 — Enhanced requirements
  Level 4 — High assurance
  Level 5 — Critical infrastructure (max security)
```

Scoring: Level-based — must meet all requirements of a level to qualify for it.

---

## 4. Templates Library

Pre-filled assessment profiles available at `/templates`:

| Template | Industry | Pre-filled controls |
|---------|---------|-------------------|
| Banking | Financial services | High security baseline |
| Hospital | Healthcare | Patient data focus |
| SaaS | Technology | Cloud-native stack |
| Government | Public sector | Legal compliance focus |

When a template is selected, the frontend loads its control data into the form (`form-iso/page.js: handleStandardChange()`). The user can review and modify before submitting.

---

## 5. Assessment History & Lifecycle

```
[Analytics Page: /analytics]
  GET /api/iso27001/history
  ↓
  Table columns: Date, Standard, Organization, Risk Level, Compliance %
  ↓
  Actions per row:
  ├── 👁 View report   → modal popup with full markdown
  ├── ♻ Reuse form    → reload original form data to /form-iso
  └── 🗑 Delete        → DELETE /api/iso27001/history/{id}
                         with optional "don't ask again 24h" flag
                         (stored in localStorage)
```

**Reuse Form**: The "Reuse" button loads the original `formData` from the assessment JSON back into the multi-step form. The user can modify answers and resubmit without re-entering all data — useful for retesting after implementing improvements.

---

## 6. AI Models Used

| Phase | Primary | Fallback |
|-------|---------|---------|
| RAG retrieval | all-MiniLM-L6-v2 (local) | — |
| Gap analysis | Open Claude (gemini-3-pro-preview) | OpenRouter → LocalAI SecurityLLM |
| Report generation | Open Claude (gemini-3-pro-preview) | OpenRouter → LocalAI Llama 3.1 70B |

The SecurityLLM model (7B, security-specialized GGUF) is used as the LocalAI fallback for gap analysis when cloud services are unavailable. For report generation, Llama 3.1 70B is preferred for its stronger Vietnamese language generation quality.
