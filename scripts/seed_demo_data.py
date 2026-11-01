"""
Seed script for SAMANVAYA Cyber Scam Platform.
Populates realistic community reports across the 25 monitored Indian corridors.
Creates authentic attack patterns:
- A SPIKE alert in 560102 (HSR Layout, Bengaluru) for Digital Arrest.
- A NEW_TYPE alert in 110016 (Hauz Khas, Delhi) for Courier Narcotics Impersonation.
- Hotspot clusters across Mumbai (400050), Hyderabad (500081), Chennai (600020), Pune (411014), Kolkata (700091).
- Canonical phone, UPI, URL, and Sender ID indicators for live universal lookups.
"""
import sys
import uuid
from datetime import datetime, timezone, timedelta
import httpx

BASE_URL = "http://localhost:8000"

def seed():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    now = datetime.now(timezone.utc)

    # Health check
    try:
        r = client.get("/health")
        if r.status_code != 200:
            print("Backend not healthy:", r.status_code)
            return
    except Exception as e:
        print("Could not connect to backend:", e)
        return

    print("Connected to backend. Seeding authentic scam incidents...")

    reports_data = [
        # --- SPIKE in 560102 (HSR Layout, Bengaluru) ---
        # 6 reports within 24h, 4 different IP prefixes, digital arrest
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 1,
            "ip": "203.0.113.0/24",
            "note": "Caller claimed to be DCP Cyber Crime Mumbai, stated my Aadhaar was linked to money laundering.",
            "loss": 25000,
        },
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 2,
            "ip": "198.51.100.0/24",
            "note": "Video call from fake police station setup with official seals and uniforms.",
            "loss": 50000,
        },
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 3,
            "ip": "192.0.2.0/24",
            "note": "Threatened immediate arrest unless funds transferred to verification account.",
            "loss": 100000,
        },
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 4,
            "ip": "203.0.113.0/24",
            "note": "Pretended to be CBI officer handling Supreme Court warrant.",
            "loss": 0,
        },
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 5,
            "ip": "198.51.100.0/24",
            "note": "Demanded biometric clearance payment via RTGS.",
            "loss": 75000,
        },
        {
            "channel": "Phone call",
            "scam_type": "digital-arrest",
            "identifier_type": "phone",
            "identifier_value": "+91 98765 43210",
            "pincode": "560102",
            "hours_ago": 6,
            "ip": "192.0.2.0/24",
            "note": "Kept victim on 4-hour Skype call under surveillance.",
            "loss": 15000,
        },

        # --- NEW_TYPE in 110016 (Hauz Khas, Delhi) ---
        # Courier narcotics parcel scam
        {
            "channel": "Phone call",
            "scam_type": "courier-customs",
            "identifier_type": "phone",
            "identifier_value": "+91 99887 76655",
            "pincode": "110016",
            "hours_ago": 2,
            "ip": "198.18.0.0/24",
            "note": "Fake FedEx tracking call claiming parcel seized at Mumbai customs with MDMA and passports.",
            "loss": 45000,
        },

        # --- Electricity Bill Disconnection in 500081 (Madhapur, Hyderabad) ---
        {
            "channel": "SMS or WhatsApp",
            "scam_type": "electricity-disconnection",
            "identifier_type": "upi",
            "identifier_value": "ebill.recovery@paytm",
            "pincode": "500081",
            "hours_ago": 4,
            "ip": "198.18.1.0/24",
            "note": "SMS: Electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Update urgently.",
            "loss": 12400,
        },

        # --- Fake KYC Phishing Link in 400050 (Bandra West, Mumbai) ---
        {
            "channel": "Fake website",
            "scam_type": "fake-kyc-link",
            "identifier_type": "url",
            "identifier_value": "https://sbi-kyc-pan-update.com/login",
            "pincode": "400050",
            "hours_ago": 8,
            "ip": "198.18.2.0/24",
            "note": "Phishing site replicating bank login page to harvest NetBanking credentials and OTP.",
            "loss": 85000,
        },

        # --- Sender ID Impersonation in 600020 (Adyar, Chennai) ---
        {
            "channel": "SMS or WhatsApp",
            "scam_type": "fake-customer-care",
            "identifier_type": "sender_id",
            "identifier_value": "VK-HDFCBK",
            "pincode": "600020",
            "hours_ago": 12,
            "ip": "198.18.3.0/24",
            "note": "Spoofed SMS sender header claiming reward points worth Rs 9,850 will expire.",
            "loss": 0,
        },

        # --- Telegram Part-time Job Scam in 411014 (Viman Nagar, Pune) ---
        {
            "channel": "SMS or WhatsApp",
            "scam_type": "job-offer",
            "identifier_type": "upi",
            "identifier_value": "earn.daily5000@okaxis",
            "pincode": "411014",
            "hours_ago": 15,
            "ip": "198.18.4.0/24",
            "note": "YouTube like and subscribe task paying Rs 50 initially, followed by crypto recharge trap.",
            "loss": 60000,
        },

        # --- Instant Loan APK Harassment in 700091 (Salt Lake, Kolkata) ---
        {
            "channel": "Something else",
            "scam_type": "loan-app-harassment",
            "identifier_type": "phone",
            "identifier_value": "+91 91234 56789",
            "pincode": "700091",
            "hours_ago": 18,
            "ip": "198.18.5.0/24",
            "note": "Unregistered instant loan app blackmailing contacts with morphed photos.",
            "loss": 32000,
        },
    ]

    success = 0
    for r in reports_data:
        occ = now - timedelta(hours=r["hours_ago"])
        rep = occ + timedelta(minutes=5)
        payload = {
            "report_id": f"rep_{uuid.uuid4().hex[:12]}",
            "occurred_at": occ.isoformat(),
            "reported_at": rep.isoformat(),
            "reporter_id": f"usr_{uuid.uuid4().hex[:8]}",
            "ip_prefix": r["ip"],
            "channel": r["channel"],
            "scam_type": r["scam_type"],
            "identifier_type": r["identifier_type"],
            "identifier_value": r["identifier_value"],
            "pincode": r["pincode"],
            "note": r["note"],
            "has_screenshot": True,
            "amount_lost_inr": r["loss"],
        }
        res = client.post("/reports", json=payload)
        if res.status_code in (200, 201):
            success += 1
            data = res.json()
            print(f"  [+] Report accepted: {payload['scam_type']} ({payload['pincode']}) -> {data.get('case_id')}")
        else:
            print(f"  [-] Failed ({res.status_code}): {res.text}")

    print(f"\nSuccessfully seeded {success}/{len(reports_data)} community reports.")

if __name__ == "__main__":
    seed()

