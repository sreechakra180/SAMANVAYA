"""
Unit tests for Satark-NLP Fraud Detection Model and Endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.services.ml_service import analyze_text, get_model_metadata

client = TestClient(app)

def test_model_metadata_loaded():
    meta = get_model_metadata()
    assert meta["model_name"] == "Satark-NLP Scam Intent Classifier"
    assert "supported_categories" in meta
    assert meta["binary_accuracy"] >= 0.90

def test_digital_arrest_detection():
    sample = (
        "Inspector Sharma from CBI New Delhi. A parcel with drugs and contraband was seized with your Aadhaar card. "
        "You are under digital arrest. Stay on Skype video call."
    )
    res = analyze_text(sample)
    assert res["is_scam"] is True
    assert res["scam_probability"] >= 0.70
    assert res["predicted_category"] == "digital_arrest"
    assert res["risk_level"] in ("HIGH", "CRITICAL")
    assert "digital arrest" in res["risk_signals"] or "cbi" in res["risk_signals"]

def test_electricity_bill_detection_and_ioc_extraction():
    sample = (
        "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the electric office. "
        "Please immediately contact electricity officer at 9876543210."
    )
    res = analyze_text(sample)
    assert res["is_scam"] is True
    assert res["predicted_category"] == "electricity_bill"
    assert "+919876543210" in res["extracted_iocs"]["phones"]

def test_kyc_phishing_detection_and_url_extraction():
    sample = (
        "Dear SBI customer, your YONO account has been suspended today due to expired KYC. "
        "Click http://sbi-kyc-update.xyz to submit Aadhaar and PAN immediately."
    )
    res = analyze_text(sample)
    assert res["is_scam"] is True
    assert res["predicted_category"] == "kyc_expiry"
    assert any("sbi-kyc-update.xyz" in u for u in res["extracted_iocs"]["urls"])

def test_legitimate_sms_not_flagged():
    legit_samples = [
        "Your SBI account 1234 is credited with Rs 45,000 on 31-Oct-2026 by NEFT salary transfer. Avail balance Rs 54,230.",
        "Dear customer, OTP for transaction of Rs 1,299 at Swiggy is 482910. Do not share your OTP with anyone.",
        "Your Uber ride is arriving in 3 mins. Driver Ramesh is on the way."
    ]
    for sample in legit_samples:
        res = analyze_text(sample)
        assert res["is_scam"] is False
        assert res["scam_probability"] < 0.50
        assert res["risk_level"] in ("LOW", "MODERATE")

def test_api_model_analyze_endpoint():
    payload = {
        "text": "FedEx Alert: Parcel containing MDMA drugs seized at customs. Call narcotics bureau at 9811223344."
    }
    r = client.post("/api/model/analyze", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["is_scam"] is True
    assert data["predicted_category"] == "customs_fedex"
    assert "+919811223344" in data["extracted_iocs"]["phones"]
    assert data["model_architecture"].startswith("Satark-NLP")

def test_api_model_info_endpoint():
    r = client.get("/api/model/info")
    assert r.status_code == 200
    data = r.json()
    assert data["model_name"] == "Satark-NLP Scam Intent Classifier"
    assert data["version"] == "1.0.0-calibrated"

