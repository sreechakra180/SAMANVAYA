import pytest
from app.services.normalise import canonicalise

@pytest.mark.parametrize("raw,expected", [
    ("+91 98765 43210", "+919876543210"),
    ("09876543210",     "+919876543210"),
    ("98765-43210",     "+919876543210"),
    ("919876543210",    "+919876543210"),
    ("1800 1600",       "+9118001600"),
    ("1930",            "+911930"),
    ("1909",            "+911909"),
])
def test_phone_forms(raw, expected):
    assert canonicalise("phone", raw) == expected

@pytest.mark.parametrize("raw", ["12345", "test", "98765", "12345678901"])
def test_phone_junk(raw):
    assert canonicalise("phone", raw) is None

def test_upi_and_url():
    assert canonicalise("upi", "Ravi12@OKAXIS") == "ravi12@okaxis"
    assert canonicalise("url", "http://www.sbi-kyc.in/pay?utm=x") == "https://sbi-kyc.in/pay"

def test_sender():
    assert canonicalise("sender_id", "VM-HDFCBK") == "HDFCBK"
    assert canonicalise("sender_id", "HDFCBK")    == "HDFCBK"

