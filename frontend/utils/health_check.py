import requests
import os

LOCALAI_URL = os.getenv("LOCALAI_URL", "http://localai:8080")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

def check_localai_health():
    try:
        response = requests.get(f"{LOCALAI_URL}/readyz", timeout=2)
        return response.status_code == 200
    except:
        return False

def check_backend_health():
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def get_localai_models():
    try:
        response = requests.get(f"{LOCALAI_URL}/v1/models", timeout=3)
        if response.status_code == 200:
            data = response.json()
            models = data.get("data", [])
            return [m.get("id", "unknown") for m in models]
        return []
    except:
        return []

def get_service_status():
    localai_ready = check_localai_health()
    backend_ready = check_backend_health()
    loaded_models = get_localai_models() if localai_ready else []
    
    return {
        "backend": {
            "status": "Running" if backend_ready else "Offline",
            "ready": backend_ready
        },
        "localai": {
            "status": "Ready" if localai_ready else "Starting",
            "ready": localai_ready
        },
        "models": loaded_models,
        "llama_ready": any("llama" in m.lower() for m in loaded_models),
        "phi_ready": any("phi" in m.lower() for m in loaded_models)
    }
