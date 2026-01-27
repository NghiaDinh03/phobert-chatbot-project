from pydantic import BaseModel

class DocumentUploadResponse(BaseModel):
    filename: str
    status: str
    chunks: int
