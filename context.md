# CyberAI Assessment Platform — Context & Solutions

## Vấn đề hiện tại

### 1. Phần cứng yếu — Không đủ tài nguyên chạy Local AI Assessment

**Thực trạng:**
- RAM: 15GB tổng, Docker containers chiếm ~13GB (Ollama 6GB + LocalAI 5GB + Backend 2GB)
- CPU: 2 cores, không có GPU
- SecurityLLM 7B + Llama 3.1 8B chạy trên LocalAI (CPU-only): ~1 token/giây
- Gemma 3n E4B (7.5GB) trên Ollama: load time 5-10 phút, inference ~2 token/giây
- Gemma 3n E2B (5.6GB) trên Ollama: load time 3-5 phút, inference ~3 token/giây
- **Không thể chạy system assessment** vì input context quá dài (3000-5000 tokens) → model timeout

### 2. Input Context quá dài cho Local Model

**Nguyên nhân:**
- System prompt tiếng Việt: ~400 tokens
- RAG context (5 chunks): ~2000 tokens
- Conversation history (10 messages): ~1500 tokens
- User message + system info (assessment form): ~1000 tokens
- **Tổng: 5000+ tokens** → Gemma 3n context window 4096 tokens bị tràn

---

## Giải pháp đề xuất

### Giải pháp 1: Nâng cấp lên Gemma 4 (Khuyến nghị)

**Google Gemma 4** mới release, có nhiều cải tiến:

| Model | Size | RAM | Context | Speed (CPU) | Chất lượng |
|-------|------|-----|---------|-------------|------------|
| gemma3n:e2b | 5.6GB | ~6GB | 4K | ~3 tok/s | Trung bình |
| gemma3n:e4b | 7.5GB | ~8GB | 4K | ~2 tok/s | Khá |
| **gemma4:2b** | ~2.5GB | ~3GB | **8K** | ~5 tok/s | Khá |
| **gemma4:4b** | ~4.5GB | ~5GB | **8K** | ~3 tok/s | Tốt |
| **gemma4:12b** | ~8GB | ~10GB | **32K** | ~1 tok/s | Rất tốt |

**Lợi ích:**
- Context window **8K-32K tokens** — đủ cho system assessment
- Hiệu suất CPU tốt hơn (architecture mới, KV-cache tối ưu)
- Gemma 4 2B nhẹ hơn cả Gemma 3n E2B mà chất lượng tương đương

**Thực hiện:**
```bash
# Pull model mới trong Ollama
docker exec phobert-ollama ollama pull gemma4:4b

# Hoặc bản nhẹ nhất
docker exec phobert-ollama ollama pull gemma4:2b
```

### Giải pháp 2: Chunked Assessment — Chia nhỏ input (Đang có sẵn)

Backend đã có `build_chunk_prompt()` trong `assessment_helpers.py`:
- Chia 93 controls thành 4 chunks (~23 controls/chunk)
- Mỗi chunk xử lý riêng → gộp kết quả
- **Vấn đề**: 4 chunks × 5 phút/chunk = 20 phút trên CPU → không thực tế

**Cải tiến:**
- Giảm chunk size xuống 10 controls/chunk
- Chỉ gửi tên control + trạng thái (không kèm mô tả)
- Tổng input mỗi chunk: ~500 tokens → đủ cho Gemma 3n/4

### Giải pháp 3: Hybrid Assessment Strategy (Khuyến nghị nhất)

**Kết hợp Cloud + Local:**
1. **Phase 1 (GAP Analysis)** → Cloud model (Gemini 3 Flash, 20 giây)
   - Input lớn: full controls + system info + RAG context
   - Cloud API xử lý 100K+ tokens dễ dàng
2. **Phase 2 (Report formatting)** → Local model (Gemma 4 2B)
   - Input nhỏ: chỉ gap results + template
   - Format report bằng tiếng Việt
3. **Fallback**: Nếu local fail → cloud xử lý cả 2 phase

**Lợi ích:**
- Nhanh (20s cloud + 2 phút local = ~2.5 phút tổng)
- Data sensitive ở phase 2 giữ local
- Không bị timeout

### Giải pháp 4: Tối ưu Context cho Local Model (Đã implement)

Đã áp dụng trong `chat_service.py`:
- **Ollama chat**: No RAG, no web search, history=2, short system prompt
- **Ollama max_tokens**: capped tại 512
- **Messages trimmed**: system + 3 messages gần nhất

### Giải pháp 5: Nâng cấp phần cứng (Tối ưu nhất)

| Cấu hình | RAM | GPU | Hiệu suất |
|-----------|-----|-----|------------|
| Hiện tại | 15GB, no GPU | - | 1-3 tok/s |
| **Budget** | 32GB + RTX 3060 12GB | ✅ | 20-30 tok/s |
| **Pro** | 64GB + RTX 4090 24GB | ✅ | 80-100 tok/s |

Với GPU, Ollama sẽ offload layers lên VRAM:
- RTX 3060 12GB: chạy được Gemma 4 12B ở 20 tok/s
- RTX 4090 24GB: chạy được Llama 3.1 70B

---

## Khuyến nghị thứ tự ưu tiên

1. **Ngay bây giờ**: Pull `gemma4:2b` hoặc `gemma4:4b` thay thế gemma3n → nhẹ hơn, context dài hơn
2. **Ngắn hạn**: Implement Hybrid Assessment (Cloud phase 1 + Local phase 2)
3. **Trung hạn**: Nâng RAM lên 32GB, thêm GPU budget (RTX 3060)
4. **Dài hạn**: Scale lên multi-node hoặc dedicated AI server

---

## Model đang cài đặt

### Ollama (cho chat)
- `gemma3n:e4b` — 7.5GB, 4K context, ~2 tok/s
- `gemma3n:e2b` — 5.6GB, 4K context, ~3 tok/s

### LocalAI (cho assessment)
- `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf` — 4.9GB, 4K context, ~1 tok/s
- `SecurityLLM-7B-Q4_K_M.gguf` — 4.4GB, 4K context, ~1 tok/s

### Cloud (cho tất cả)
- Gemini 3 Flash — không giới hạn, ~50 tok/s, qua Open Claude API
- GPT-5 Mini — không giới hạn, ~40 tok/s

---

*Cập nhật: 2026-04-07*
