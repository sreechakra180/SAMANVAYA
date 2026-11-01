import os, base64, pytest
os.environ.setdefault("TRUST_HMAC_KEY", base64.b64encode(os.urandom(32)).decode())
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("LICENCE_PUBKEY_PATH", "./licence_pubkey.b64")
os.environ.setdefault("LICENCE_FILE_PATH", "./licence.json")

from fastapi.testclient import TestClient
from app.main import app, init_db

@pytest.fixture
def client():
    init_db()
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def bypass_licence(monkeypatch):
    from app.middleware import licence_gate
    monkeypatch.setattr(licence_gate, "current", lambda: {
        "licensee": "Test", "expires_at": "2099-01-01T00:00:00+00:00", "signature": ""
    })

