# backend/api/routes/cliente_routes.py

from fastapi import APIRouter, Depends, HTTPException
from services.cliente_service import ClienteService
from models.Cliente import ClienteCreate, ClienteResponse
from typing import List
from dependencies.auth_dependencies import get_current_user, require_permission
from utils.responses import error_response

router = APIRouter(
    tags=["Clientes"]
)

# ─────────── Endpoints ───────────

# Listar todos los clientes (Requiere permiso)
@router.get("/", response_model=List[ClienteResponse], dependencies=[Depends(require_permission("clients:read"))])
def listar(
    nombre: str = None, 
    num_identificacion: str = None, 
    correo: str = None, 
    service: ClienteService = Depends()
):
    return service.listar_clientes(nombre, num_identificacion, correo)

# Obtener un cliente por ID
@router.get("/{cliente_id}", response_model=ClienteResponse, dependencies=[Depends(require_permission("clients:read"))])
def obtener(cliente_id: int, service: ClienteService = Depends()):
    cliente = service.obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=error_response(404, "Cliente no encontrado"))
    return cliente

# Crear cliente
@router.post("/", response_model=dict, dependencies=[Depends(require_permission("clients:create"))])
def crear(
    datos: ClienteCreate,
    service: ClienteService = Depends()
):
    resultado = service.crear_cliente(datos)
    if "error" in resultado:
        raise HTTPException(
            status_code=400,
            detail=error_response(400, resultado["error"])
        )
    return resultado


# Actualizar cliente
@router.put("/{cliente_id}", response_model=dict, dependencies=[Depends(require_permission("clients:update"))])
def actualizar(
    cliente_id: int,
    datos: ClienteCreate,
    service: ClienteService = Depends()
):
    resultado = service.actualizar_cliente(cliente_id, datos)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=error_response(400, resultado["error"]))
    elif not resultado.get("success"):
        raise HTTPException(status_code=404, detail=error_response(404, "Cliente no encontrado"))
    return resultado


# Eliminar cliente
@router.delete("/{cliente_id}", response_model=dict, dependencies=[Depends(require_permission("clients:delete"))])
def eliminar(cliente_id: int,
             service: ClienteService = Depends()):
    resultado = service.eliminar_cliente(cliente_id)
    if "error" in resultado:
        raise HTTPException(status_code=404, detail=error_response(404, resultado["error"]))
    return resultado
