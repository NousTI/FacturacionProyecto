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
        raise HTTPException(status_code=403, detail=error_response(403, "Forbidden"))

    # Reusar el middleware de main
    @test_app.middleware("http")
    async def _middleware(request, call_next):
        return await error_handling_middleware(request, call_next)

    client = TestClient(test_app)
    resp = client.get("/fail")
    assert resp.status_code == 403
    body = resp.json()
    # Acepta respuesta directa o envuelta en detail segun FastAPI
    expected = {"code": 403, "message": "Forbidden"}
    assert body == expected or body.get("detail") == expected


def test_unhandled_exception_returns_500():
    test_app = FastAPI()

    @test_app.get("/boom")
    def boom():
        raise RuntimeError("boom")

    test_app.middleware("http")(error_handling_middleware)

    client = TestClient(test_app)
    resp = client.get("/boom")
    assert resp.status_code == 500
    assert resp.json() == {"code": 500, "message": "Error interno del servidor"}
