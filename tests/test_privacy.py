import json

def _payload(rid, reporter, ip, note):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": "+91 98765 43210",
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": note, "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_lookup_never_leaks_pii(client):
    secret = "UNIQUE_NOTE_MARKER_42"
    client.post("/reports", json=_payload("rep_p", "reporter_SECRET_A", "10.9.9", secret))
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    body = json.dumps(r.json())
    assert "reporter_SECRET_A" not in body
    assert "10.9.9" not in body
    assert secret not in body

