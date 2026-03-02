# PhoBERT Chatbot Project

## Cấu trúc thư mục

```text
phobert-chatbot-project/
│
├── .vs/                                    # Visual Studio cache (gitignored)
├── venv/                                   # Python virtual environment (gitignored)
│
├── frontend/
│   ├── .streamlit/
│   │   └── config.toml
│   ├── components/
│   │   ├── __init__.py
│   │   └── html_renderer.py
│   ├── pages/
│   │   ├── analytics.py
│   │   ├── chatbot.py
│   │   └── upload.py
│   ├── static/
│   │   ├── css/
│   │   │   ├── analytics.css
│   │   │   ├── base.css
│   │   │   ├── chatbot.css
│   │   │   └── upload.css
│   │   ├── images/
│   │   │   ├── avatar-bot.svg
│   │   │   ├── avatar-user.svg
│   │   │   └── logo.svg
│   │   └── js/
│   │       ├── analytics.js
│   │       ├── base.js
│   │       ├── chatbot.js
│   │       └── upload.js
│   ├── templates/
│   │   ├── analytics.html
│   │   ├── base.html
│   │   ├── chatbot.html
│   │   └── upload.html
│   ├── utils/
│   │   ├── __init__.py
│   │   └── session.py
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── document.py
│   │   │   └── health.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   └── document.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── session_store.py
│   │   └── vector_store.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── chat_service.py
│   │   ├── document_service.py
│   │   └── rag_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── helpers.py
│   │   └── logger.py
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── models/
│   ├── configs/
│   │   ├── llm_config.py
│   │   └── phobert_config.py
│   ├── llm/
│   │   └── llama-3.1-8b.yaml
│   ├── phobert/
│   │   ├── added_tokens.json
│   │   ├── bpe.codes
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   ├── special_tokens_map.json
│   │   ├── tokenizer_config.json
│   │   └── vocab.txt
│   ├── scripts/
│   │   ├── build_index.py
│   │   └── download_models.py
│   └── Dockerfile
│
├── data/
│   ├── knowledge_base/
│   │   ├── controls.json
│   │   ├── iso27001.json
│   │   └── tcvn14423.json
│   ├── sessions/
│   │   └── .gitkeep
│   ├── uploads/
│   │   └── .gitkeep
│   └── vector_store/
│       ├── index.faiss
│       └── metadata.json
│
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── deployment.md
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
└── requirements.txt
```
