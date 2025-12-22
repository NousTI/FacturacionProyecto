
import sys
import os
from pathlib import Path

# Add project root and backend to sys.path
root_dir = str(Path(__file__).resolve().parent)
backend_dir = str(Path(__file__).resolve().parent / "backend")
sys.path.append(root_dir)
sys.path.append(backend_dir)

print(f"Checking imports. Path includes: {backend_dir}")

files_to_check = [
    "backend.repositories.cliente_repository",
    "backend.repositories.user_sessions_repository",
    "backend.services.user_session_service",
    "backend.repositories.user_repository",
    "backend.services.cliente_service",
    "backend.api.routes.cliente_routes",
    "backend.services.empresa_service",
    "backend.api.routes.empresa_routes",
    "backend.services.user_service",
    "backend.api.routes.usuarios_routes",
    "backend.services.vendedor_service",
    "backend.api.routes.vendedor_routes",
    "backend.services.comision_service",
    "backend.api.routes.comision_routes",
    "backend.services.permiso_service",
    "backend.api.routes.permiso_routes",
    "backend.repositories.superadmin_repository",
    "backend.repositories.suscripcion_repository",
    "backend.services.suscripcion_service",
    "backend.services.superadmin_service",
    "backend.api.routes.superadmin_routes",
    "backend.services.subscription_monitor_service"
]

for module in files_to_check:
    try:
        __import__(module)
        print(f"[OK] {module}")
    except Exception as e:
        print(f"[FAIL] {module}: {e}")
