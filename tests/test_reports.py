def _payload(rid="rep_1", value="+91 98765 43210", reporter="r_1", ip="10.0.0"):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": value,
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": "Video call from a man in police uniform.",
        "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_create_and_idempotency(client):
    r1 = client.post("/reports", json=_payload())
    assert r1.status_code == 201
    r2 = client.post("/reports", json=_payload())     # same report_id
    assert r2.status_code == 201
    assert r2.json()["report_id"] == r1.json()["report_id"]

def test_junk_rejected(client):
    p = _payload(value="12345")
    r = client.post("/reports", json=p)
    assert r.status_code == 400

