# backend/tests/test_middleware.py
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from main import error_handling_middleware  # noqa: E402
from utils.responses import error_response  # noqa: E402


def test_http_exception_returns_standard_shape():
    test_app = FastAPI()

    @test_app.get("/fail")
    def fail():
        # Ahora error_response devuelve el esquema completo
        raise HTTPException(status_code=403, detail=error_response("FORBIDDEN_CODE", "Forbidden"))

    @test_app.middleware("http")
    async def _middleware(request, call_next):
        return await error_handling_middleware(request, call_next)

    client = TestClient(test_app)
    resp = client.get("/fail")
    assert resp.status_code == 403
    body = resp.json()
    
    # Nuevo esquema: {status, code, message, timestamp}
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN_CODE"
    assert body["message"] == "Forbidden"
    assert "timestamp" in body


def test_unhandled_exception_returns_500():
    test_app = FastAPI()

    @test_app.get("/boom")
    def boom():
        raise RuntimeError("boom")

    test_app.middleware("http")(error_handling_middleware)

    client = TestClient(test_app)
    resp = client.get("/boom")
    assert resp.status_code == 500
    body = resp.json()
    assert body["status"] == "error"
    assert body["code"] == "INTERNAL_ERROR"
    assert body["message"] == "Error interno del servidor"
    assert "timestamp" in body
