from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import chat, document, health, iso27001

# Create FastAPI app
app = FastAPI(
    title="PhoBERT ISO27001 API",
    description="AI-powered ISO 27001 compliance chatbot with RAG capabilities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware - Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: ["http://localhost:8501"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(document.router, prefix="/api", tags=["Documents"])
app.include_router(iso27001.router, prefix="/api", tags=["ISO27001"])

@app.get("/")
def root():
    """Root endpoint - API status"""
    return {
        "status": "running",
        "service": "PhoBERT ISO27001 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    """Quick health check"""
    return {"status": "healthy"}
