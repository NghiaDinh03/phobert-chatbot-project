# PhoBERT AI Platform - Enterprise Edition

Nền tảng AI tiên tiến cho đánh giá tuân thủ **ISO 27001:2022** & **TCVN 14423**.
Tích hợp công nghệ **PhoBERT** và **Llama 3.1 8B** được tối ưu hóa cho tiếng Việt.

## Cấu trúc thư mục

```text
phobert-chatbot-project/
│
├── frontend-next/                          # Next.js Frontend (React)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js                   # Root layout + Navbar
│   │   │   ├── globals.css                 # Design system
│   │   │   ├── page.js                     # Dashboard (trang chủ)
│   │   │   ├── chatbot/
│   │   │   │   └── page.js                 # AI Chatbot
│   │   │   ├── analytics/
│   │   │   │   └── page.js                 # Analytics Dashboard
│   │   │   └── form-iso/
│   │   │       └── page.js                 # ISO 27001 Assessment
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── SystemStats.js              # Real-time system monitoring
│   │   └── lib/
│   │       └── api.js                      # API client
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.js
│
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py                     # Chat API
│   │   │   ├── document.py                 # Document upload
│   │   │   ├── health.py                   # Health check
│   │   │   ├── iso27001.py                 # ISO 27001 API
│   │   │   └── system.py                   # System stats API (real-time)
│   │   └── schemas/
│   │       ├── chat.py
│   │       └── document.py
│   ├── core/
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── services/
│   │   ├── chat_service.py
│   │   ├── document_service.py
│   │   └── rag_service.py
│   ├── utils/
│   │   ├── helpers.py
│   │   └── logger.py
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   ├── knowledge_base/
│   │   ├── controls.json
│   │   ├── iso27001.json
│   │   └── tcvn14423.json
│   ├── sessions/
│   ├── uploads/
│   └── vector_store/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Frontend** | Next.js 15, React 19, CSS Modules |
| **Backend** | FastAPI, Python 3.10 |
| **LLM** | Llama 3.1 8B (Q4_K_M) via LocalAI |
| **NLP** | PhoBERT (Vietnamese) |
| **Container** | Docker Compose |

## Cài đặt & Chạy

### Yêu cầu
- Docker & Docker Compose
- Tối thiểu 16GB RAM (khuyến nghị 32GB)

### Chạy project

```bash
# Clone repository
git clone https://github.com/NghiaDinh03/phobert-chatbot-project.git
cd phobert-chatbot-project

# Copy file environment
cp .env.example .env

# Khởi chạy toàn bộ services
docker-compose up --build -d
```

### Truy cập

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **LocalAI** | http://localhost:8080 |

## Cấu hình

| Biến | Mô tả | Default |
|---|---|---|
| `MODEL_NAME` | Tên model LLM | `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf` |
| `CONTEXT_SIZE` | Context window (tokens) | `8192` |
| `MAX_TOKENS` | Giới hạn output (-1 = unlimited) | `-1` |
| `THREADS` | Số CPU threads cho LocalAI | `8` |
