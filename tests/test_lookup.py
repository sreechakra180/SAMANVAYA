def _payload(rid, reporter, ip):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": "+91 98765 43210",
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": "Call.", "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_new_is_no_reports(client):
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "NO_REPORTS"

def test_verified_short_circuit(client):
    r = client.get("/lookup", params={"type": "phone", "value": "1930"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "VERIFIED_BUSINESS"

def test_after_report_is_suspicious(client):
    client.post("/reports", json=_payload("rep_a", "r_a", "10.0.1"))
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "SUSPICIOUS"     # safe while APPROVED=False
    assert r.json()["challenged"] is False

def test_dispute_suppresses(client):
    client.post("/reports", json=_payload("rep_b", "r_b", "10.0.2"))
    client.post("/challenges", json={
        "identifier_type": "phone", "identifier_value": "+919876543210",
        "claimant_name": "X", "contact_email": "x@x", "proof_note": ""
    })
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.json()["verdict"] != "KNOWN_SCAM"
    assert r.json()["challenged"] is True

