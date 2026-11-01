"""
Community Scam Map — Tests for Twelve-Scenario Simulation Matrix (S1–S12)
Directly tests the mathematical behavior against Part 3, Section 7 of the Design Book.
"""
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from app.services.trust_engine import assess
from app.thresholds import CALIBRATED_CONFIG

@dataclass
class MockReport:
    report_id: str
    reporter_fp: bytes
    net_fp: bytes
    occurred_at: datetime
    reported_at: datetime
    scam_type: str
    channel: str = "Phone call"
    pincode: str = "560102"
    note: str = ""
    has_screenshot: bool = False
    amount_lost_inr: int = 0
    w: float = 0.0
    trust_state: int = 1

def test_s1_organic_genuine_wave():
    # S1: 7 victims, distinct networks & reporters, own words, filed within 24h
    now = datetime.now(timezone.utc)
    victim_notes = [
        "Got a video call claiming to be Delhi police saying parcel seized with contraband drugs. Demanded fifty thousand immediately.",
        "Fake CBI officer on Skype threatened arrest under money laundering unless I cleared funds to their verification account.",
        "They pretended to be customs officials in Mumbai airport holding an illegal international package under my Aadhaar number.",
        "Caller in police uniform accused me of sending forged passport documents abroad and demanded urgent surety bond transfer.",
        "Received intimidation call claiming cyber crime branch issued non-bailable arrest warrant against my primary bank account.",
        "Scammer posed as telecom department stating my mobile number will be disconnected within two hours for unlawful activities.",
        "Threatening video call with fake police station background asking to verify my savings account balance via immediate RTGS."
    ]
    reports = [
        MockReport(
            report_id=f"rep_{i}",
            reporter_fp=f"user_{i}".encode(),
            net_fp=f"net_{i}".encode(),
            occurred_at=now - timedelta(hours=i*2),
            reported_at=now - timedelta(hours=i*2),
            scam_type="digital-arrest",
            note=victim_notes[i]
        )
        for i in range(7)
    ]
    a = assess(reports, CALIBRATED_CONFIG, now)
    assert a.distinct_reporters == 7
    assert a.score >= 0.75
    assert a.state == "HIGH_CONFIDENCE"
    assert a.verdict == "KNOWN_SCAM"

def test_s2_forty_friend_bombing():
    # S2: 40 accounts, mixed net, 3 note templates, filed in 90 min
    now = datetime.now(timezone.utc)
    templates = [
        "This bakery is running a massive credit card scam and defrauding people.",
        "Fraud bakery beware of UPI payments here they steal money directly.",
        "Scam store in HSR layout alert everyone not to buy anything."
    ]
    reports = [
        MockReport(
            report_id=f"bomb_{i}",
            reporter_fp=f"actor_{i}".encode(),
            net_fp=f"net_{i}".encode(),
            occurred_at=now - timedelta(minutes=i*2),
            reported_at=now - timedelta(minutes=i*2),
            scam_type="fake-customer-care",
            note=templates[i % 3]
        )
        for i in range(40)
    ]
    a = assess(reports, CALIBRATED_CONFIG, now)
    # Campaign must be collapsed into 1 cluster
    assert a.distinct_reporters <= 2
    assert a.verdict == "SUSPICIOUS"  # Never KNOWN_SCAM
    assert "CAMPAIGN_COLLAPSED" in a.reason_codes

def test_s3_same_wifi_22_accounts():
    # S3: 22 accounts, single net_fp within 25 min
    now = datetime.now(timezone.utc)
    reports = [
        MockReport(
            report_id=f"wifi_{i}",
            reporter_fp=f"actor_{i}".encode(),
            net_fp=b"shared_wifi_ip",
            occurred_at=now - timedelta(minutes=i),
            reported_at=now - timedelta(minutes=i),
            scam_type="fake-kyc-link",
            note="Fake bank link received on SMS."
        )
        for i in range(22)
    ]
    a = assess(reports, CALIBRATED_CONFIG, now)
    assert a.distinct_reporters == 1
    assert a.verdict == "SUSPICIOUS"

def test_s4_six_repeats_one_reporter():
    # S4: Same reporter 6 times
    now = datetime.now(timezone.utc)
    reports = [
        MockReport(
            report_id=f"rep_{i}",
            reporter_fp=b"same_reporter",
            net_fp=f"net_{i}".encode(),
            occurred_at=now - timedelta(hours=i),
            reported_at=now - timedelta(hours=i),
            scam_type="job-offer",
            note="Telegram task scam offer."
        )
        for i in range(6)
    ]
    a = assess(reports, CALIBRATED_CONFIG, now)
    assert a.distinct_reporters == 1
    assert a.verdict == "SUSPICIOUS"

def test_s10_business_dispute_hard_veto():
    # S10: Even with 7 organic reports, if challenged is True -> MUST be SUSPICIOUS
    now = datetime.now(timezone.utc)
    reports = [
        MockReport(
            report_id=f"rep_{i}",
            reporter_fp=f"user_{i}".encode(),
            net_fp=f"net_{i}".encode(),
            occurred_at=now - timedelta(hours=i*2),
            reported_at=now - timedelta(hours=i*2),
            scam_type="digital-arrest",
            note=f"Distinct report {i} regarding harassment call."
        )
        for i in range(7)
    ]
    a = assess(reports, CALIBRATED_CONFIG, now, challenged=True)
    assert a.state == "DISPUTED"
    assert a.verdict == "SUSPICIOUS"
    assert "CHALLENGE_OPEN" in a.reason_codes

def test_s12_first_time_user_single_report():
    # S12: 1 report, good quality -> c=1, masked, SUSPICIOUS
    now = datetime.now(timezone.utc)
    reports = [
        MockReport(
            report_id="rep_single",
            reporter_fp=b"user_new",
            net_fp=b"net_home",
            occurred_at=now - timedelta(hours=1),
            reported_at=now - timedelta(minutes=45),
            scam_type="electricity-disconnection",
            note="Received electricity power cut threat SMS from this number with APK download link."
        )
    ]
    a = assess(reports, CALIBRATED_CONFIG, now)
    assert a.distinct_reporters == 1
    assert a.verdict == "SUSPICIOUS"
    assert a.state == "UNVERIFIED"
