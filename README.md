# PhoBERT AI Platform — Hệ thống RAG & Đánh giá An toàn Thông tin Toàn diện

Nền tảng AI on-premise kết hợp đánh giá tuân thủ **ISO 27001:2022**, Tra cứu thông tin (RAG), và Tổng hợp Tin tức Tự động. Toàn bộ hệ thống chạy cục bộ bằng Docker, đảm bảo an toàn dữ liệu 100%.

---

## Tính năng và Phân bổ theo Trang (Pages)

Hệ thống được thiết kế theo dạng Single Page Application (SPA), phân chia tính năng rõ ràng qua từng Tab:

### 1. 🏠 Trang chủ (Dashboard)
- Hiển thị giới thiệu tổng quan hệ thống và các chỉ mục dẫn hướng nhanh.
- Tích hợp Đồng hồ thời gian thực (Live Clock) chuyển đổi 4 múi giờ (VN, UTC, US, JP).

### 2. 💬 AI Chat (Chatbot RAG)
👉 **[Xem chi tiết Hướng dẫn Cơ chế Hoạt động RAG](./docs/chatbot_rag.md)**
- Trò chuyện với AI bằng tiếng Việt, hỏi đáp sâu về ATTT, tiêu chuẩn ISO 27001.
- Tích hợp **ChromaDB** nạp trực tiếp file `.md`. Khi người dùng hỏi, AI tự động nhúng (Embed) và trích xuất (RAG) các khoản luật liên quan vào câu trả lời.

### 3. 📊 Analytics (Giám sát Hệ thống)
👉 **[Xem chi tiết Hướng dẫn Quản trị và Analytics](./docs/analytics_monitoring.md)**
- **Status Hub:** Xem trạng thái sống của các container (FastAPI, LocalAI) và các Model đang được nạp.
- **Tài nguyên phần cứng:** Giám sát mức tiêu thụ CPU, RAM, Disk.
- **Cache Controller:** Thống kê sinh cache (Dịch & Audio) tránh tràn Disk ổ cứng.
- **ChromaDB Monitor:** Giao diện quản trị Database vector. Tích hợp nút `🔄 Nạp lại` dữ liệu và `Tìm kiếm thử`.  👉 *([Đọc thêm Guide ChromaDB](./docs/chromadb_guide.md))*
- **Lịch sử ISO:** Quản lý xem lại Form đánh giá cũ, Nạp lại, và Xoá rác với cảnh báo Confirm Browser-side.

### 4. 📝 Form ISO (Đánh giá Tuân thủ)
👉 **[Xem chi tiết Luồng Data Form Đánh giá ISO](./docs/iso_assessment_form.md)**
- Điền khảo sát hệ thống mạng doanh nghiệp toàn diện.
- Gửi lên **SecurityLLM** soi lỗi phân tích bảo mật. Sau đó **Llama 3.1** đóng vai trò báo cáo sinh ra văn bản đánh giá (Action Plan).

### 5. 📰 Tin tức (AI News Aggregator & TTS)
👉 **[Xem chi tiết Cơ chế Crawl Tin & Sinh Audio TTS Nội bộ](./docs/news_aggregator.md)**
- Thu thập bài báo mới từ RSS của các trang Cybersecurity chuyên sâu.
- Các báo Anh ngữ được **Mô hình VinAI Translate** (135M parameters) dịch ngầm Title qua tiếng Việt hoàn tòan nội bộ.
- Dùng **Llama 3.1** Rút gọn nội dung link gốc. Đọc văn thành tiếng Voice Việt "Quốc dân" bằng modul Python `edge-tts`. Tối ưu tự xóa Cache định kỳ bảo vệ ổ cứng.

---

## Hệ thống Models & AI đang sử dụng (On-Premise)

| Model | Tham số | Nhiệm vụ chính trong Project | Engine |
|---|---|---|---|
| **Llama 3.1 Instruct** | 8B (Q4_K_M) | Chatbot, Sinh Report ISO 27001, Tóm tắt bài báo, Phân loại gán tự động Tag tin tức. | LocalAI |
| **SecurityLLM** | 7B (Q4_K_M) | Soi lỗi bảo mật Form ISO, đánh giá điểm rủi ro chuyên sâu hệ thống mạng. | LocalAI |
| **VinAI Translate (En-Vi)** | 135M | Chạy ngầm liên tục, phiên dịch Title bài báo Tiếng Anh -> Tiếng Việt theo ngữ cảnh. | HuggingFace (Transformers) |
| **all-MiniLM-L6-v2** | - | Nhúng chữ (Embedding) các tài liệu, luật, nghị định ISO thành Vector. | ChromaDB |
| **Edge-TTS** | - | Service tổng hợp giọng nói tiếng Việt mượt mà (Không chiếm Card, call API nội bộ thiết bị). | Python lib |

---

## Kiến trúc Thư mục Kỹ thuật (Tóm tắt)

```text
phobert-chatbot-project/
│
├── frontend-next/                          # Next.js 15 Frontend
│   ├── src/app/
│   │   ├── (các tab: chatbot, analytics, form-iso, news)
│
├── backend/                                # FastAPI Backend
│   ├── api/routes/
│   │   ├── chat.py, iso27001.py, system.py, news.py
│   ├── services/
│   │   ├── chat_service.py                 # RAG & LocalAI interaction
│   │   ├── model_router.py                 # Phối hợp SecurityLLM ↔ Llama 3.1
│   │   ├── news_service.py                 # Crawl RSS, kích hoạt dịch và gán Tag ngầm
│   │   ├── translation_service.py          # Load VinAI Transformers & Dịch Title báo
│   │   └── summary_service.py              # Extract báo, gọi Llama tóm tắt & gTTS audio
│   ├── repositories/
│   │   └── vector_store.py                 # Cầu nối gọi lệnh tới ChromaDB
│   └── requirements.txt                    # edge-tts, newspaper3k, httpx, lxml...
│
├── data/
│   ├── iso_documents/                      # Chứa file .md cho RAG (Mount động)
│   ├── summaries/                          # Cache JSON & AUDIO (.mp3) từ Tin tức Text-to-Speech
│   ├── translations/                       # Cache title_vi JSON
│   ├── assessments/                        # JSON report form đánh giá 
│   ├── vector_store/                       # ChromaDB persistent data (sqlite)
│   └── models/huggingface/                 # Nơi VinAI tải Model cache ẩn
│
├── models/                                 # Chứa file vật lý GGUF (Llama, SecurityLLM)
├── docs/                                   # File hướng dẫn bổ sung (vd: chromadb_guide.md)
└── docker-compose.yml                      # Script 1-lệnh duy nhất (Frontend + Backend + LLMs)
```

---

## Cài đặt và Triển khai (Docker-based)

Yêu cầu duy nhất để hệ thống hoạt động là máy có chạy `Docker Compose`. Dự án không phụ thuộc vào thư viện cài trực tiếp trên máy host nào cả.

1. **Clone mã nguồn:**
   ```bash
   git clone https://github.com/NghiaDinh03/phobert-chatbot-project.git
   cd phobert-chatbot-project
   cp .env.example .env
   ```
2. **Khởi chạy toán hệ thống:**
   ```bash
   docker-compose up --build -d
   ```
3. Lệnh này sẽ tự kéo các image, tải GGUF model vào `/models`, nạp thư viện `transformers` và chạy 3 container `phobert-frontend`, `phobert-backend`, `phobert-localai`.
4. Truy cập giao diện tại: **http://localhost:3000**

👉 _Tham khảo Hướng dẫn nạp file tự động vào ChromaDB tại: **[Hướng dẫn ChromaDB](./docs/chromadb_guide.md)**._
