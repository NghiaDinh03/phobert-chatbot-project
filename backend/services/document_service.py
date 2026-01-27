from fastapi import UploadFile

class DocumentService:
    async def process_upload(self, file: UploadFile):
        content = await file.read()
        # Process document (placeholder)
        return {
            "filename": file.filename,
            "status": "processed",
            "chunks": 10
        }
