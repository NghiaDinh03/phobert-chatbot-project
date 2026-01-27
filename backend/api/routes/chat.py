from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.chat_service import ChatService
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: str = Field(default="default", description="Session identifier")

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str
    model: str
    session_id: str
    tokens: Optional[dict] = None
    error: Optional[bool] = False

@router.post("/chat", response_model=ChatResponse, summary="Send chat message")
async def chat(request: ChatRequest):
    """
    Send a message to the AI chatbot and receive a response.
    
    - **message**: The user's message (1-2000 characters)
    - **session_id**: Optional session identifier for context
    
    Returns the AI's response along with token usage information.
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        result = ChatService.generate_response(
            message=request.message.strip(),
            session_id=request.session_id
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/chat/health", summary="Check chat service health")
async def chat_health():
    return ChatService.health_check()
