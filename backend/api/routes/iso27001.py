from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

class ISO27001Assessment(BaseModel):
    organization: Dict[str, Any]
    scope: Dict[str, Any]
    compliance: Dict[str, Any]
    objectives: List[str]
    notes: str = ""

@router.post("/iso27001/assess")
async def assess(data: ISO27001Assessment):
    score = 0
    recs = []
    
    if data.compliance["status"] == "Đã chứng nhận":
        score += 50
    elif data.compliance["status"] == "Đang triển khai":
        score += 25
        recs.append("Hoàn thiện tài liệu ISMS")
    else:
        recs.append("Bắt đầu gap analysis")
    
    if data.compliance["risk_freq"] == "6 tháng/lần":
        score += 30
    elif data.compliance["risk_freq"] == "1 năm/lần":
        score += 15
    
    if data.compliance["incidents"] > 5:
        recs.append("Cải thiện quy trình phản ứng sự cố")
    
    score = min(100, score + len(data.objectives) * 5)
    
    return {
        "score": score,
        "level": "Cao" if score >= 70 else "Trung bình" if score >= 40 else "Thấp",
        "recommendations": recs,
        "next_steps": ["Audit nội bộ", "Đào tạo nhân viên", "Chuẩn bị chứng nhận"]
    }
