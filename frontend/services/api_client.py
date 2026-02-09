import requests
import os
from typing import Dict, Any

class APIClient:
    BASE_URL = os.getenv("BACKEND_URL", "http://backend:8000")
    
    @staticmethod
    def health_check() -> Dict[str, Any]:
        try:
            response = requests.get(f"{APIClient.BASE_URL}/api/health", timeout=5)
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def chat(message: str, session_id: str) -> Dict[str, Any]:
        try:
            response = requests.post(
                f"{APIClient.BASE_URL}/api/chat",
                json={"message": message, "session_id": session_id},
                timeout=300
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"Backend error: {response.status_code}",
                    "detail": response.text
                }
                
        except requests.exceptions.Timeout:
            return {"error": "Request timeout (90 giây). Model đang xử lý quá lâu. Vui lòng thử câu hỏi ngắn hơn."}
        
        except requests.exceptions.ConnectionError:
            return {"error": "Không kết nối được backend. Kiểm tra Docker container."}
        
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def upload_document(file) -> Dict[str, Any]:
        try:
            files = {"file": (file.name, file.getvalue(), file.type)}
            response = requests.post(
                f"{APIClient.BASE_URL}/api/documents/upload",
                files=files,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Upload failed: {response.status_code}"}
                
        except Exception as e:
            return {"error": str(e)}
