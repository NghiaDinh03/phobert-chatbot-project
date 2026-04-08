"""Chat API Routes — Streaming, history, and session management."""

import json
import threading
import time
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.config import settings
from services.chat_service import ChatService

router = APIRouter()

try:
    from core.limiter import limiter, _has_rate_limit
except ImportError:
    limiter = None
    _has_rate_limit = False


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(default="default")
    model: Optional[str] = Field(default="gemini-3-flash-preview")
    prefer_cloud: bool = Field(default=True)


class ChatResponse(BaseModel):
    response: str
    model: str
    session_id: str
    tokens: Optional[dict] = None
    error: Optional[bool] = False
    route: Optional[str] = None
    provider: Optional[str] = None
    rag_used: Optional[bool] = None
    search_used: Optional[bool] = None
    sources: Optional[list] = None
    web_sources: Optional[list] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(http_request: Request, request: ChatRequest, background_tasks: BackgroundTasks):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        return await ChatService.generate_response(
            message=request.message.strip(),
            session_id=request.session_id,
            model_override=request.model,
            prefer_cloud=request.prefer_cloud,
            background_tasks=background_tasks,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    def event_generator():
        """Generator that streams SSE events with heartbeat to keep connection alive.

        The LLM inference (especially local models on CPU) can take 2-5 minutes.
        Without heartbeats, browser/proxy will close the idle connection.
        """
        import queue as q_module

        event_queue: q_module.Queue = q_module.Queue()
        done_event = threading.Event()

        def producer():
            try:
                for event in ChatService.generate_response_stream(
                    message=request.message.strip(),
                    session_id=request.session_id,
                    model_override=request.model,
                    prefer_cloud=request.prefer_cloud,
                ):
                    event_queue.put(event)
            except Exception as exc:
                event_queue.put({
                    "step": "error",
                    "data": {
                        "error": True,
                        "response": f"Lỗi: {str(exc)}",
                        "model": settings.MODEL_NAME,
                        "session_id": request.session_id,
                    },
                })
            finally:
                done_event.set()

        thread = threading.Thread(target=producer, daemon=True)
        thread.start()

        # Drain the queue, yielding heartbeats when no data arrives within 15s
        while not (done_event.is_set() and event_queue.empty()):
            try:
                event = event_queue.get(timeout=15)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                # Stop iterating after terminal events
                if event.get("step") in ("done", "error"):
                    break
            except q_module.Empty:
                # Send SSE comment heartbeat — keeps connection alive through nginx/proxies
                yield ": heartbeat\n\n"

        thread.join(timeout=5)

    return StreamingResponse(
        event_generator(), media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    return ChatService.clear_conversation(session_id)


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    ss = ChatService.get_session_store()
    history = ss.get_history(session_id)
    return {"session_id": session_id, "messages": history, "count": len(history)}


@router.get("/chat/health")
async def chat_health():
    base = ChatService.health_check()
    from services.model_guard import ModelGuard
    base["model_guard"] = ModelGuard.status()
    base["local_only_mode"] = settings.LOCAL_ONLY_MODE
    return base
