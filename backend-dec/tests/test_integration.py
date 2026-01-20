import sys
from pathlib import Path

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

import main  # noqa: E402
import api.routes.auth_router as auth_router  # noqa: E402
from dependencies.auth_dependencies import get_current_user  # noqa: E402
from api.routes.auth_router import get_db_connection  # noqa: E402
from services.cliente_service import ClienteService  # noqa: E402


class FakeConn:
    def cursor(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, *args, **kwargs):
        return None

    def fetchone(self):
        return {"id": 1}

    def fetchall(self):
        return []

    def commit(self):
        return None

    def rollback(self):
        return None


def override_db():
    yield FakeConn()


def override_get_current_user(request: Request):
    request.state.jwt_payload = {"sid": "sid123", "sub": "1"}
    return {
        "id": 1,
        "fk_rol": 1,
        "fk_suscripcion": 1,
        "usuario": "demo",
        "correo": "demo@test.com",
    }


class FakeClienteService:
    def listar_clientes_por_usuario(self, usuario_id: int):
        return [
            {
                "id": 1,
                "nombre": "ACME",
                "num_identificacion": "123456",
                "celular": "5551234",
                "direccion": "Calle 1",
                "correo": "acme@test.com",
                "tipo_cliente": "NATURAL",
                "fk_usuario": usuario_id,
            }
        ]

    def obtener_cliente(self, cliente_id: int):
        return {
            "id": cliente_id,
            "nombre": "ACME",
            "num_identificacion": "123456",
            "celular": "5551234",
            "direccion": "Calle 1",
            "correo": "acme@test.com",
            "tipo_cliente": "NATURAL",
            "fk_usuario": 1,
        }

    def crear_cliente(self, datos, usuario_id: int):
        return {"success": True, "id": 1}

    def actualizar_cliente(self, cliente_id: int, datos, usuario_id: int):
        return {"success": True, "id": cliente_id}

    def eliminar_cliente(self, cliente_id: int):
        return {"success": True, "id": cliente_id}


@pytest.fixture(autouse=True)
def setup_overrides(monkeypatch):
    # Dependencias
    main.app.dependency_overrides[get_db_connection] = override_db
    main.app.dependency_overrides[get_current_user] = override_get_current_user
    main.app.dependency_overrides[ClienteService] = lambda: FakeClienteService()

    # Monkeypatch de funciones importadas en auth_router
    monkeypatch.setattr(auth_router, "register_user", lambda *args, **kwargs: {"id": 1, "fk_rol": 1, "fk_suscripcion": 1, "usuario": "demo", "correo": "demo@test.com"})
    monkeypatch.setattr(auth_router, "authenticate_user", lambda *args, **kwargs: {"id": 1})
    monkeypatch.setattr(auth_router, "start_user_session", lambda *args, **kwargs: "sid123")
    monkeypatch.setattr(auth_router, "end_user_session", lambda *args, **kwargs: True)

    yield
    main.app.dependency_overrides = {}


def test_register_success():
    client = TestClient(main.app)
    payload = {
        "usuario": "demo",
        "contrasena": "password123",
        "fk_rol": 1,
        "fk_suscripcion": 1,
        "correo": "demo@test.com",
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["usuario"] == "demo"
    assert data["fk_rol"] == 1


def test_login_success():
    client = TestClient(main.app)
    resp = client.post("/api/auth/login", json={"usuario": "demo", "contrasena": "password123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_logout_success():
    client = TestClient(main.app)
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Sesión cerrada correctamente"


def test_clientes_crud():
    client = TestClient(main.app)
    # Listar
    resp = client.get("/api/clientes/")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list) and body[0]["nombre"] == "ACME"
    # Crear
    payload = {
        "nombre": "ACME",
        "num_identificacion": "123456",
        "celular": "5551234",
        "direccion": "Calle 1",
        "correo": "acme@test.com",
        "tipo_cliente": "NATURAL",
    }
    resp = client.post("/api/clientes/", json=payload)
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    # Actualizar
    resp = client.put("/api/clientes/1", json=payload)
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    # Eliminar
    resp = client.delete("/api/clientes/1")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
