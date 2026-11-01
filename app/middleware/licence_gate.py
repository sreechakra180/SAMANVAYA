import json, base64, time
from pathlib import Path
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from app.config import LICENCE_PUBKEY_PATH, LICENCE_FILE_PATH

EXEMPT = {"/health", "/license", "/docs", "/openapi.json", "/redoc"}
_state = {"licence": None, "verified_at": 0}
RELOAD_SECONDS = 30

def _load_pubkey() -> VerifyKey:
    return VerifyKey(base64.b64decode(Path(LICENCE_PUBKEY_PATH).read_text().strip()))

def _load_and_verify() -> dict | None:
    p = Path(LICENCE_FILE_PATH)
    if not p.exists(): return None
    try:
        doc = json.loads(p.read_text())
        payload = {k: doc[k] for k in ("licensee", "expires_at")}
        sig = base64.b64decode(doc["signature"])
        _load_pubkey().verify(json.dumps(payload, sort_keys=True).encode(), sig)
        return doc
    except (KeyError, BadSignatureError, Exception):
        return None

def reload_licence():
    _state["licence"] = _load_and_verify()
    _state["verified_at"] = time.time()

def current() -> dict | None:
    if time.time() - _state["verified_at"] > RELOAD_SECONDS or _state["licence"] is None:
        reload_licence()
    return _state["licence"]

async def licence_middleware(request: Request, call_next):
    # Allow CORS preflight and exempt paths
    if request.method == "OPTIONS" or request.url.path in EXEMPT or request.url.path.startswith("/license"):
        return await call_next(request)
    lic = current()
    if not lic:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    from datetime import datetime, timezone
    try:
        exp = datetime.fromisoformat(lic["expires_at"])
    except Exception:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    if datetime.now(timezone.utc) >= exp:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    return await call_next(request)
