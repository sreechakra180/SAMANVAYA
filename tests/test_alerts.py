"""
Community Scam Map — Tests for Alerts Engine (SPIKE & NEW_TYPE)
Covers test cases from Part 2, Section D (Table D.2 & D.3) of the Design Book.
"""
from datetime import datetime, timedelta, timezone
from app.db.models import Report
from app.db.session import SessionLocal

def _insert_report(db, rid, pin, scam_type, occ, net_b=b"net_default", trust=1):
    rep = Report(
        report_id=rid,
        indicator_id=1,
        occurred_at=occ,
        reported_at=occ,
        ingested_at=occ,
        reporter_fp=b"rid_" + rid.encode(),
        net_fp=net_b,
        channel="Phone call",
        scam_type=scam_type,
        pincode=pin,
        note_len=20,
        has_screenshot=False,
        amount_lost_inr=0,
        w=0.8,
        trust_state=trust,
    )
    db.add(rep)

def test_spike_fires_on_threshold(client):
    # Setup S1: n24 = 5, baseline = 2.0 (14 reports in 7d baseline window), net_diversity = 3
    now = datetime.now(timezone.utc)
    pin = "560102"

    with SessionLocal() as db:
        # 5 reports in 24h with 3 distinct net_fp
        _insert_report(db, "r1", pin, "digital-arrest", now - timedelta(hours=2), b"net_1", trust=1)
        _insert_report(db, "r2", pin, "digital-arrest", now - timedelta(hours=3), b"net_2", trust=1)
        _insert_report(db, "r3", pin, "digital-arrest", now - timedelta(hours=4), b"net_3", trust=1)
        _insert_report(db, "r4", pin, "digital-arrest", now - timedelta(hours=5), b"net_1", trust=1)
        _insert_report(db, "r5", pin, "digital-arrest", now - timedelta(hours=6), b"net_2", trust=1)

        # 14 reports in [now-8d, now-1d) -> baseline = 14 / 7 = 2.0
        for i in range(14):
            _insert_report(db, f"b_{i}", pin, "digital-arrest", now - timedelta(days=2, hours=i), b"net_b", trust=1)

        db.commit()

    r = client.get("/alerts", params={"pincode": pin})
    assert r.status_code == 200
    alerts = r.json()["alerts"]
    spike = next((a for a in alerts if a["type"] == "SPIKE"), None)
    assert spike is not None
    assert spike["count"] == 5
    assert spike["baseline_per_day"] == 2.0

def test_spike_zero_baseline_floor(client):
    # S4: baseline = 0.0, n24 = 5 -> floor controls (2*0=0 vacuous)
    now = datetime.now(timezone.utc)
    pin = "560038"

    with SessionLocal() as db:
        for i in range(5):
            _insert_report(db, f"s4_{i}", pin, "otp-call", now - timedelta(hours=i+1), f"net_{i%3}".encode(), trust=1)
        db.commit()

    r = client.get("/alerts", params={"pincode": pin})
    alerts = r.json()["alerts"]
    spike = next((a for a in alerts if a["type"] == "SPIKE"), None)
    assert spike is not None
    assert spike["count"] == 5

def test_spike_hardening_diversity_gate(client):
    # S8: 5 reports in 24h but all from SAME net_fp (< 3 diversity) -> Suppressed
    now = datetime.now(timezone.utc)
    pin = "560034"

    with SessionLocal() as db:
        for i in range(5):
            _insert_report(db, f"s8_{i}", pin, "fake-kyc-link", now - timedelta(hours=i+1), b"same_net", trust=1)
        db.commit()

    r = client.get("/alerts", params={"pincode": pin})
    alerts = r.json()["alerts"]
    spike = next((a for a in alerts if a["type"] == "SPIKE"), None)
    assert spike is None

def test_new_type_detection_and_no_self_suppression(client):
    # N1: 'job-offer' in last 24h, none in prior 30d -> fires NEW_TYPE
    # N6: 'sextortion' multiple times in 24h, none prior -> does not self-suppress
    now = datetime.now(timezone.utc)
    pin = "560066"

    with SessionLocal() as db:
        _insert_report(db, "nt_1", pin, "job-offer", now - timedelta(hours=3), b"net_x", trust=1)
        _insert_report(db, "nt_2", pin, "sextortion", now - timedelta(hours=4), b"net_y", trust=1)
        _insert_report(db, "nt_3", pin, "sextortion", now - timedelta(hours=8), b"net_z", trust=1)

        # Add prior report for 'digital-arrest' in prior 30d -> should NOT trigger NEW_TYPE
        _insert_report(db, "prior_1", pin, "digital-arrest", now - timedelta(days=10), b"net_old", trust=1)
        _insert_report(db, "nt_4", pin, "digital-arrest", now - timedelta(hours=5), b"net_w", trust=1)

        db.commit()

    r = client.get("/alerts", params={"pincode": pin})
    alerts = r.json()["alerts"]
    new_types = {a["scam_type"] for a in alerts if a["type"] == "NEW_TYPE"}
    assert "job-offer" in new_types
    assert "sextortion" in new_types
    assert "digital-arrest" not in new_types

