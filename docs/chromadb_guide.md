# ChromaDB Vector Store — Guide & Operations

ChromaDB is the on-premise vector database that powers the RAG (Retrieval-Augmented Generation) system. It stores mathematical representations (embeddings) of all ISO/law documents so the AI can retrieve the most relevant paragraphs for any given question.

---

## 1. How ChromaDB Works in This Project

```
data/iso_documents/*.md  (your knowledge base)
        │
        ▼
[vector_store.py: load_documents()]

  For each .md file:
  ├── Read full file text
  ├── Split by ## headers (header-aware chunking)
  │   ├── chunk_size: 500 characters
  │   ├── overlap: 150 characters
  │   └── Parent ## header prepended to each split chunk
  │       (so LLM always knows which section a chunk belongs to)
  └── Generate embedding: all-MiniLM-L6-v2 → 384-dim vector

        │
        ▼
ChromaDB collection: "iso_knowledge"
  Storage: data/vector_store/chroma.sqlite3
  Metric: Cosine Similarity
  Each entry: { id, embedding, document_text, metadata: { source } }

        │
        ▼
[At query time: rag_service.py]
  User question → embed → 384-dim vector
  collection.query(n_results=3)
  Returns: top-3 chunks ranked by cosine similarity score
  Injected into LLM prompt as RAG context
```

### Why header-aware chunking matters

If a chunk is split in the middle of section `## A.8.1 — User endpoint devices`, the child chunk would lose its section context. The chunker prepends the parent `##` header to every split, so the LLM always receives:

```
## A.8.1 — User endpoint devices
...Tổ chức phải áp dụng các biện pháp kiểm soát...
```

This dramatically reduces hallucination by keeping chunks semantically anchored.

---

## 2. Adding New Documents to the Knowledge Base

### Step 1: Prepare your document as Markdown

Convert Word/PDF documents to clean Markdown. Follow the structure:
```markdown
# Title of the document

## Section name (H2 = chunking boundary)
Content of this section...

## Another section
More content...
```

**Do:** Use `##` headers to separate major topics — each `##` section becomes one or more vector chunks.  
**Don't:** Use walls of text with no headers — this creates poor-quality oversized chunks.

See [Markdown RAG Standard](./markdown_rag_standard.md) for the full formatting guide and PICO method.

### Step 2: Drop file into the knowledge base folder

Copy your `.md` file to:
```
data/iso_documents/your-document.md
```

Thanks to the Docker volume mount (`./data:/data`), files placed here are immediately accessible inside the `phobert-backend` container — no restart needed.

### Step 3: Trigger reindex

1. Open **http://localhost:3000/analytics**
2. Scroll to the **🗄️ ChromaDB Vector Hub** panel
3. Click **🔄 Reload / Reindex**
4. Wait for the response showing `chunks_loaded: N`

The backend will:
- Drop the existing `iso_knowledge` collection
- Scan all `*.md` files in `data/iso_documents/`
- Chunk and embed all documents
- Rebuild the collection

### Step 4: Verify with Test Search

In the same panel, type a phrase from your new document into the search box and press Enter. You should see your document appear in the results with a high cosine similarity score (> 0.7).

---

## 3. Current Knowledge Base Files

| File | Description |
|------|-------------|
| `iso27001_annex_a.md` | ISO 27001:2022 Annex A — all 93 controls |
| `tcvn_11930_2017.md` | TCVN 11930:2017 — Vietnamese security level standard |
| `luat_an_ninh_mang_2018.md` | Cybersecurity Law 2018 (Vietnam) |
| `nghi_dinh_13_2023_bvdlcn.md` | Personal Data Protection Decree 13/2023 |
| `network_infrastructure.md` | Network security architecture guidance |
| `assessment_criteria.md` | Assessment scoring and criteria definitions |
| `checklist_danh_gia_he_thong.md` | System evaluation checklist |

---

## 4. Troubleshooting

### Problem: Reindex fails with "duplicate" or "collection error"

**Solution:**
1. Stop the system: `docker-compose down`
2. Delete the corrupted database: remove `data/vector_store/` directory entirely
3. Restart: `docker-compose up -d`
4. The backend auto-rebuilds ChromaDB from scratch on startup

### Problem: Search returns irrelevant results

**Cause:** Document is poorly structured (no `##` headers, large blocks of text)  
**Solution:** Restructure the document with clear `##` section headers and re-reindex

### Problem: Chatbot gives wrong or hallucinated answers

**Diagnosis steps:**
1. Go to Analytics → ChromaDB panel → test search with the same phrase the user asked
2. Check the returned chunks — are they from the correct document and section?
3. If chunks are wrong: improve document structure and reindex
4. If chunks are correct but LLM ignores them: the system prompt may need adjustment

### Problem: Vector store takes too much disk space

**Each chunk stores:** ~1.5 KB (embedding 384 floats × 4 bytes + metadata)  
**For 342 chunks:** ~512 KB — this is negligible.  
If the database grows unexpectedly, delete and rebuild from scratch (see above).

---

## 5. ChromaDB Technical Details

| Parameter | Value |
|-----------|-------|
| Library | `chromadb` (Python) |
| Storage backend | SQLite (file-based) |
| Storage path | `data/vector_store/chroma.sqlite3` |
| Embedding model | `all-MiniLM-L6-v2` (sentence-transformers) |
| Embedding dimension | 384 |
| Distance metric | Cosine similarity |
| Collection name | `iso_knowledge` |
| Default chunk size | 500 characters |
| Chunk overlap | 150 characters |
| Results per query | 3 (configurable in `rag_service.py`) |
| Chunking strategy | Header-aware (`##` boundary detection) |
