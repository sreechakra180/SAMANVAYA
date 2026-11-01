import hmac, hashlib, base64
from app.config import TRUST_HMAC_KEY

def _key() -> bytes:
    try:
        return base64.b64decode(TRUST_HMAC_KEY)
    except Exception:
        return TRUST_HMAC_KEY.encode()

def rid_fp(reporter_id: str) -> bytes:
    return hmac.new(_key(), b"rid:" + reporter_id.encode(), hashlib.sha256).digest()

def net_fp(ip_prefix: str) -> bytes:
    return hmac.new(_key(), b"net:" + ip_prefix.encode(), hashlib.sha256).digest()[:16]

