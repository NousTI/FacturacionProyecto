from uuid import UUID
from typing import Optional
from fastapi import Depends

from . import ServicioFacturaCore
from ..schemas import FacturaCreacion, FacturaActualizacion, FacturaAnulacion, FacturaListadoFiltros
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError
from ...usuarios.repositories import RepositorioUsuarios
from .service_base import ValidacionesFactura
from ...formas_pago.repository import RepositorioFormasPago

class ServicioFactura:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        usuario_repo: RepositorioUsuarios = Depends(),
        formas_pago_repo: RepositorioFormasPago = Depends()
    ):
        self.core = core
        self.usuario_repo = usuario_repo
        self.formas_pago_repo = formas_pago_repo

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

        datos.empresa_id = empresa_id
        datos.usuario_id = usuario_id
        datos.ambiente = 1 # FORZAR A PRUEBAS POR SEGURIDAD
        
        print(f"Ambiente forzado a: {datos.ambiente}")
        print("Creando factura en BD (borrador sin número secuencial)...")
        
        payload_extra = {
            "numero_factura": None,
            "secuencial_punto_emision": None
        }
        
        nueva = self.core.crear_borrador(datos, usuario_actual, payload_extra)
        
        if '_pago_inicial' in nueva:
            pago_data = nueva.pop('_pago_inicial')
            pago_data['factura_id'] = nueva['id']
            # Guardamos la forma de pago ligada a factura nueva 
            self.formas_pago_repo.crear_pago(pago_data)
            
        return nueva

    def obtener_factura(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            u_fact = self.usuario_repo.obtener_por_user_id(usuario_actual['id'])
            if u_fact:
                usuario_actual['usuario_facturacion_id'] = u_fact['id']
        return ValidacionesFactura.obtener_y_validar_factura(self.core, id, usuario_actual)

    def listar_facturas(self, usuario_actual: dict, empresa_id: Optional[UUID] = None, filtros: Optional[FacturaListadoFiltros] = None, solo_propias: bool = False, limit: int = 100, offset: int = 0):
        from ....constants.permissions import PermissionCodes
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = empresa_id if is_superadmin else usuario_actual.get("empresa_id")
        
        target_usuario_id = None
        if not is_superadmin:
            permisos = usuario_actual.get("permisos", [])
            
            # Resolve internal user id for facturacion module
            usuario_fact = self.usuario_repo.obtener_por_user_id(usuario_actual['id'])
            internal_user_id = usuario_fact['id'] if usuario_fact else None
            
            # Enforce "own only" if they don't have "view all"
            if PermissionCodes.FACTURAS_VER_TODAS not in permisos:
                solo_propias = True
            
            if solo_propias:
                target_usuario_id = internal_user_id

        return self.core.repo.listar_facturas(
            empresa_id=target_empresa_id,
            usuario_id=target_usuario_id,
            filtros=filtros,
            limit=limit,
            offset=offset
        )

    def actualizar_factura(self, id: UUID, datos: FacturaActualizacion, usuario_actual: dict):
        print(f"--- [SERVICE] actualizar_factura ID: {id} ---")
        factura = self.obtener_factura(id, usuario_actual)
        ValidacionesFactura.validar_estado_borrador(factura)
        
        payload = datos.model_dump(exclude_unset=True)
        # Separar campos de pagos
        pago_update = {}
        for key in ['forma_pago_sri', 'plazo', 'unidad_tiempo']:
            if key in payload:
                pago_update[key] = payload.pop(key)
                
        # Solo ejecutar actualización de factura si sobraron campos
        actualizada = self.core.actualizar_factura(id, payload) if payload else factura
        
        if pago_update:
            pagos_existentes = self.formas_pago_repo.listar_por_factura(id)
            if pagos_existentes:
                self.formas_pago_repo.actualizar_pago(pagos_existentes[0]['id'], pago_update)
            
        return actualizada

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

    def actualizar_estado_pago(self, id: UUID, estado_pago: str, usuario_actual: dict):
        """Actualiza el estado de pago de una factura."""
        self.obtener_factura(id, usuario_actual) # Valida existencia y pertenencia
        return self.core.actualizar_factura(id, {"estado_pago": estado_pago})

    def obtener_detalle_completo(self, id: UUID, usuario_actual: dict):
        """Obtiene la factura y todos sus detalles (útil para RIDE/PDF)."""
        factura = self.obtener_factura(id, usuario_actual)
        detalles = self.core.repo.listar_detalles(id)
        factura['detalles'] = detalles
        return factura
