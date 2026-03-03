from uuid import UUID
from typing import Optional
from fastapi import Depends

from . import ServicioFacturaCore
from ..schemas import FacturaCreacion, FacturaActualizacion, FacturaAnulacion, FacturaListadoFiltros
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError
from ...usuarios.repositories import RepositorioUsuarios
from .service_base import ValidacionesFactura

class ServicioFactura:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        usuario_repo: RepositorioUsuarios = Depends()
    ):
        self.core = core
        self.usuario_repo = usuario_repo

    def crear_factura(self, datos: FacturaCreacion, usuario_actual: dict):
        """Orquestador para creación de factura (Borrador)."""
        print(f"--- [SERVICE] crear_factura iniciado ---")
        
        empresa_id = usuario_actual.get("empresa_id") if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) else datos.empresa_id
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            auth_user_id = usuario_actual.get("id")
            usuario_facturacion = self.usuario_repo.obtener_por_user_id(auth_user_id)
            if not usuario_facturacion:
                raise AppError("Usuario no encontrado en el sistema de facturación", 404, "USUARIO_NOT_FOUND")
            usuario_id = usuario_facturacion['id']
        else:
            usuario_id = datos.usuario_id
        
        if not empresa_id: raise AppError("Empresa no especificada", 400, "VAL_ERROR")

        print(f"Recuperando entidades para factura. ClienteID: {datos.cliente_id}, EstabID: {datos.establecimiento_id}")
        cliente = self.core.cliente_service.obtener_cliente(datos.cliente_id, usuario_actual)
        establecimiento = self.core.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)
        punto = self.core.punto_emision_service.obtener_punto(datos.punto_emision_id, usuario_actual)
        empresa = self.core.empresa_service.obtener_empresa(empresa_id, usuario_actual)

        snapshots = {
            "snapshot_empresa": empresa,
            "snapshot_cliente": cliente,
            "snapshot_establecimiento": establecimiento,
            "snapshot_punto_emision": {**punto, "secuencial_usado": None},
            "snapshot_usuario": usuario_actual
        }

        datos.empresa_id = empresa_id
        datos.usuario_id = usuario_id
        datos.ambiente = 1 # FORZAR A PRUEBAS POR SEGURIDAD
        
        print(f"Ambiente forzado a: {datos.ambiente}")
        print("Creando factura en BD (borrador sin número secuencial)...")
        
        payload_extra = {
            "numero_factura": None,
            "secuencial_punto_emision": None
        }
        
        return self.core.crear_borrador(datos, usuario_actual, {**snapshots, **payload_extra})

    def obtener_factura(self, id: UUID, usuario_actual: dict):
        return ValidacionesFactura.obtener_y_validar_factura(self.core, id, usuario_actual)

    def listar_facturas(self, usuario_actual: dict, empresa_id: Optional[UUID] = None, filtros: Optional[FacturaListadoFiltros] = None, solo_propias: bool = False, limit: int = 100, offset: int = 0):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = empresa_id if is_superadmin else usuario_actual.get("empresa_id")
        target_usuario_id = usuario_actual.get("id") if solo_propias else None
        
        return self.core.repo.listar_facturas(
            empresa_id=target_empresa_id,
            usuario_id=target_usuario_id,
            filtros=filtros,
            limit=limit,
            offset=offset
        )

    def actualizar_factura(self, id: UUID, datos: FacturaActualizacion, usuario_actual: dict):
        print(f"--- [SERVICE] actualizar_factura ID: {id} ---")
        print(f"Datos a actualizar: {datos.dict(exclude_unset=True)}")
        factura = self.obtener_factura(id, usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        return self.core.actualizar_factura(id, datos.model_dump(exclude_unset=True))

    def eliminar_factura(self, id: UUID, usuario_actual: dict):
        factura = self.obtener_factura(id, usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        return self.core.repo.eliminar_factura(id)

    def anular_factura(self, id: UUID, datos: FacturaAnulacion, usuario_actual: dict):
        factura = self.obtener_factura(id, usuario_actual)
        if factura.get('estado') != 'AUTORIZADA':
            raise AppError("Solo facturas AUTORIZADAS pueden anularse", 400, "VAL_ERROR")
        
        return self.core.actualizar_factura(id, {
            "estado": "ANULADA",
            "razon_anulacion": datos.razon_anulacion
        })
