import json, base64
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.config import LICENCE_FILE_PATH
from app.middleware.licence_gate import current, reload_licence

router = APIRouter()

@router.get("/license")
def get_license():
    lic = current()
    if not lic:
        return {"licensee": None, "expires_at": None, "status": "none"}
    return {"licensee": lic["licensee"], "expires_at": lic["expires_at"], "status": "valid"}

@router.post("/license")
async def upload_license(request: Request):
    body = await request.body()
    try:
        doc = json.loads(body)
        for k in ("licensee", "expires_at", "signature"):
            if k not in doc: raise ValueError("missing field")
    except Exception as e:
        return JSONResponse({"error": f"invalid licence payload: {e}"}, status_code=400)
    Path(LICENCE_FILE_PATH).write_text(json.dumps(doc))
    reload_licence()
    return {"ok": True, "licensee": doc["licensee"], "expires_at": doc["expires_at"]}

