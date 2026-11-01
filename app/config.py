import os
from pathlib import Path

# Load local .env if present and keys not already in environment
env_file = Path(".env")
if env_file.exists():
    try:
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

def _require(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if not val:
        raise RuntimeError(f"missing env: {name}")
    return val

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./scam_map.db")
TRUST_HMAC_KEY = _require("TRUST_HMAC_KEY")
LICENCE_PUBKEY_PATH = Path(os.environ.get("LICENCE_PUBKEY_PATH", "./licence_pubkey.b64"))
LICENCE_FILE_PATH = Path(os.environ.get("LICENCE_FILE_PATH", "./licence.json"))
THRESHOLDS_APPROVED = os.environ.get("THRESHOLDS_APPROVED", "false").lower() == "true"

