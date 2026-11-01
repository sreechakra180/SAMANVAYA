"""
Endpoints for Satark-NLP Fraud Classification Model.
Enables real-time scam intent analysis, category classification,
IOC extraction, and model metadata inspection.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.ml_service import analyze_text, get_model_metadata

router = APIRouter(tags=["ML Fraud Detection Model"])

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000, description="SMS, WhatsApp, or victim report text to analyze")

class TextAnalysisResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    is_scam: bool
    scam_probability: float
    predicted_category: str
    risk_level: str
    extracted_iocs: Dict[str, List[str]]
    risk_signals: List[str]
    model_status: str
    model_architecture: str
    inference_latency_ms: float

@router.post("/model/analyze", response_model=TextAnalysisResponse)
@router.post("/api/model/analyze", response_model=TextAnalysisResponse)
def analyze_fraud_text(req: TextAnalysisRequest):
    """
    Analyze free-text message (SMS, WhatsApp, transcript) using Satark-NLP.
    Detects scam probability, predicts scam archetype, extracts IOCs (phones, UPI, URLs),
    and surfaces explainable risk triggers.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    result = analyze_text(req.text)
    return result

@router.get("/model/info")
@router.get("/api/model/info")
def get_info() -> Dict[str, Any]:
    """Return model evaluation metrics, accuracy, F1-score, and training metadata."""
    return get_model_metadata()

@router.get("/model/samples")
@router.get("/api/model/samples")
def get_sample_scams() -> List[Dict[str, str]]:
    """Return ready-to-test sample messages for demonstration."""
    return [
        {
            "category": "Digital Arrest",
            "text": "This is Inspector Sharma from CBI headquarters New Delhi. A parcel containing MDMA drugs was seized with your Aadhaar card. You are placed under digital arrest. Stay on Skype call."
        },
        {
            "category": "Electricity Bill",
            "text": "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from electric office because previous month bill was not updated. Immediately contact officer at 9876543210."
        },
        {
            "category": "KYC Expiry / Phishing",
            "text": "Dear SBI customer, your YONO account has been suspended today due to expired KYC. Please click link http://sbi-kyc-update.xyz to submit Aadhaar and PAN immediately."
        },
        {
            "category": "Part-Time Job",
            "text": "Earn Rs 3000 to 8000 daily by working from home! Simple YouTube video liking task. No experience required. Message on Telegram @workfromhome_hr."
        },
        {
            "category": "Legitimate Bank SMS",
            "text": "Your SBI account ending 1234 is credited with Rs 45,000 on 31-Oct-2026 by NEFT salary transfer. Available balance Rs 54,230."
        }
    ]
