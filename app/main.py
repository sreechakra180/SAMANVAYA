import os, base64, logging, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.config import DATABASE_URL
from app.db.session import Base, engine, SessionLocal
from app.db.models import ClockState
from app.middleware.licence_gate import licence_middleware, reload_licence
from app.routes import health, reports, lookup, map, alerts, admin, challenges, licence, model_routes

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("scam_map")

def init_db():
    Base.metadata.create_all(engine)

def _clock_check():
    """Refuse if the wall clock appears to have rolled backwards by >5 min."""
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        row = db.scalar(select(ClockState).where(ClockState.id == 1))
        if row is None:
            db.add(ClockState(id=1, max_seen=now))
            db.commit()
            return
        max_seen = row.max_seen
        if max_seen.tzinfo is None:
            max_seen = max_seen.replace(tzinfo=timezone.utc)
        else:
            max_seen = max_seen.astimezone(timezone.utc)
        if now < max_seen - timedelta(minutes=5):
            raise RuntimeError("clock rollback detected")
        if now > max_seen:
            row.max_seen = now
            db.commit()

app = FastAPI(title="Community Scam Map", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(licence_middleware)

for r in (health, reports, lookup, map, alerts, admin, challenges, licence, model_routes):
    app.include_router(r.router)
    app.include_router(r.router, prefix="/api")

frontend_dist = Path("app/frontend/dist")
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

@app.on_event("startup")
def _startup():
    init_db()
    reload_licence()
    try:
        _clock_check()
    except Exception as e:
        log.error("clock check failed: %s", e)
    from app.thresholds import load
    try:
        load()
    except RuntimeError as e:
        log.warning("thresholds load failed: %s", e)
