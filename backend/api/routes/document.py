from fastapi import APIRouter, UploadFile, File
from services.document_service import DocumentService

router = APIRouter()
doc_service = DocumentService()

try:
    from core.limiter import limiter, _has_rate_limit
except ImportError:
    limiter = None
    _has_rate_limit = False


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    result = await doc_service.process_upload(file)
    return result
