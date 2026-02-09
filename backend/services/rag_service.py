import requests
from core.config import settings
from repositories.vector_store import VectorStore

class RAGService:
    def __init__(self):
        self.vector_store = VectorStore()
    
    def retrieve_context(self, query: str) -> str:
        # Search similar documents
        results = self.vector_store.search(query, top_k=3)
        context = "\n".join([doc["text"] for doc in results])
        return context
    
    async def generate_response(self, query: str, context: str) -> str:
        # Call LocalAI
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        
        try:
            response = requests.post(
                f"{settings.LOCALAI_URL}/v1/completions",
                json={
                    "model": "llama-3.1-8b",
                    "prompt": prompt,
                    "max_tokens": 2048
                },
                timeout=30
            )
            return response.json()["choices"][0]["text"]
        except:
            return "Xin lỗi, tôi không thể trả lời lúc này."
