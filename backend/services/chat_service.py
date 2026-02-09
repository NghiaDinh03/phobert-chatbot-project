import requests
import os
from typing import Dict, Any

class ChatService:
    LOCALAI_URL = os.getenv("LOCALAI_URL", "http://localai:8080")
    MODEL_NAME = os.getenv("MODEL_NAME", "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf")
    
    @staticmethod
    def generate_response(message: str, session_id: str = "default") -> Dict[str, Any]:
        try:
            payload = {
                "model": ChatService.MODEL_NAME,
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2048,
                "stream": False
            }
            
            response = requests.post(
                f"{ChatService.LOCALAI_URL}/v1/chat/completions",
                json=payload,
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                bot_message = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                if not bot_message:
                    bot_message = "Model không trả về response. Vui lòng thử lại."
                
                return {
                    "response": bot_message.strip(),
                    "model": ChatService.MODEL_NAME,
                    "session_id": session_id,
                    "tokens": {
                        "prompt_tokens": data.get("usage", {}).get("prompt_tokens", 0),
                        "completion_tokens": data.get("usage", {}).get("completion_tokens", 0),
                        "total_tokens": data.get("usage", {}).get("total_tokens", 0)
                    }
                }
            else:
                error_msg = response.text
                return {
                    "response": f"LocalAI error ({response.status_code}): {error_msg}",
                    "model": ChatService.MODEL_NAME,
                    "session_id": session_id,
                    "error": True
                }
                
        except requests.exceptions.Timeout:
            return {
                "response": "Request timeout. Model đang xử lý quá lâu. Vui lòng thử câu hỏi ngắn hơn hoặc tăng THREADS trong docker-compose.yml.",
                "model": ChatService.MODEL_NAME,
                "session_id": session_id,
                "error": True
            }
            
        except requests.exceptions.ConnectionError:
            return {
                "response": "Không thể kết nối LocalAI. Kiểm tra container đang chạy.",
                "model": ChatService.MODEL_NAME,
                "session_id": session_id,
                "error": True
            }
            
        except Exception as e:
            return {
                "response": f"Unexpected error: {str(e)}",
                "model": ChatService.MODEL_NAME,
                "session_id": session_id,
                "error": True
            }
    
    @staticmethod
    def health_check() -> Dict[str, Any]:
        try:
            response = requests.get(
                f"{ChatService.LOCALAI_URL}/readyz",
                timeout=5
            )
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "localai_url": ChatService.LOCALAI_URL,
                    "model": ChatService.MODEL_NAME
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"LocalAI returned {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
