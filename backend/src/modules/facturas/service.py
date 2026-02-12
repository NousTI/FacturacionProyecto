"""
Servicio Orquestador de Facturas.

Este servicio coordina la lógica de negocio para facturas electrónicas,
delegando tareas específicas a servicios especializados (Core, SRI, Pagos, Recurrentes).
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import Depends

from .services import (
    ServicioFacturaCore, 
    ServicioSRIFacturas, 
    ServicioPagosFactura,
    ServicioRecurringBilling
)
from .schemas import FacturaCreacion, FacturaActualizacion, FacturaAnulacion, FacturaListadoFiltros
from .schemas_logs import LogEmisionCreacion, AutorizacionSRICreacion, LogPagoCreacion
from .schemas_programacion import (
    FacturacionProgramadaCreacion,
    FacturacionProgramadaActualizacion
)
from ...constants.enums import AuthKeys
from ...constants.roles import RolCodigo
from ...errors.app_error import AppError
from ..usuarios.repositories import RepositorioUsuarios

class ServicioFacturas:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        sri_facturacion: ServicioSRIFacturas = Depends(),
        pagos_factura: ServicioPagosFactura = Depends(),
        recurrentes: ServicioRecurringBilling = Depends(),
        usuario_repo: RepositorioUsuarios = Depends()
    ):
        self.core = core
        self.sri_facturacion = sri_facturacion
        self.pagos_factura = pagos_factura
        self.recurrentes = recurrentes
        self.usuario_repo = usuario_repo

    # =================================================================
    # VALIDACIONES DE NEGOCIO (ORQUESTADOR)
    # =================================================================

    def _validar_acceso_factura(self, factura: dict, usuario_actual: dict):
        """Valida que el usuario tenga permiso para ver/operar la factura."""
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(factura['empresa_id']) != str(usuario_actual.get("empresa_id")):
                raise AppError("No tiene permiso para esta factura", 403, "AUTH_FORBIDDEN")

    def _validar_rol_operativo(self, usuario_actual: dict):
        """
        Validación de rol operativo deprecada.
        Ahora confiamos en los permisos granulares (FACTURAS_CREAR, etc)
        manejados por el router y el sistema de permisos.
        """
        pass

    def _validar_estado_borrador(self, factura: dict):
        if factura.get('estado') != 'BORRADOR':
            raise AppError("Solo facturas en BORRADOR pueden modificarse", 400, "VAL_ERROR")

    # =================================================================
    # FLUJOS PRINCIPALES
    # =================================================================

    def crear_factura(self, datos: FacturaCreacion, usuario_actual: dict):
        """Orquestador para creación de factura (Borrador)."""
        print(f"--- [SERVICE] crear_factura iniciado ---")
        self._validar_rol_operativo(usuario_actual)
        
        empresa_id = usuario_actual.get("empresa_id") if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) else datos.empresa_id
        
        # Obtener el usuario_id correcto de la tabla sistema_facturacion.usuarios
        # usando el user_id de autenticación
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            auth_user_id = usuario_actual.get("id")  # ID de la tabla 'users'
            usuario_facturacion = self.usuario_repo.obtener_por_user_id(auth_user_id)
            if not usuario_facturacion:
                raise AppError("Usuario no encontrado en el sistema de facturación", 404, "USUARIO_NOT_FOUND")
            usuario_id = usuario_facturacion['id']  # ID de la tabla 'usuarios'
        else:
            usuario_id = datos.usuario_id
        
        if not empresa_id: raise AppError("Empresa no especificada", 400, "VAL_ERROR")

        print(f"Recuperando entidades para factura. ClienteID: {datos.cliente_id}, EstabID: {datos.establecimiento_id}")
        cliente = self.core.cliente_service.obtener_cliente(datos.cliente_id, usuario_actual)
        establecimiento = self.core.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)
        punto = self.core.punto_emision_service.obtener_punto(datos.punto_emision_id, usuario_actual)
        empresa = self.core.empresa_service.obtener_empresa(empresa_id, usuario_actual)

        # YA NO INCREMENTAMOS AQUÍ. El número se asigna al emitir para evitar saltos si se elimina un borrador.
        snapshots = {
            "snapshot_empresa": empresa,
            "snapshot_cliente": cliente,
            "snapshot_establecimiento": establecimiento,
            "snapshot_punto_emision": {**punto, "secuencial_usado": None},
            "snapshot_usuario": usuario_actual
        }

        # Inyectar IDs calculados en datos para persistencia
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
        factura = self.core.obtener_factura(id)
        self._validar_acceso_factura(factura, usuario_actual)
        return factura

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
        self._validar_estado_borrador(factura)
        return self.core.actualizar_factura(id, datos.model_dump(exclude_unset=True))

    def eliminar_factura(self, id: UUID, usuario_actual: dict):
        factura = self.obtener_factura(id, usuario_actual)
        self._validar_estado_borrador(factura)
        return self.core.repo.eliminar_factura(id)

    def anular_factura(self, id: UUID, datos: FacturaAnulacion, usuario_actual: dict):
        factura = self.obtener_factura(id, usuario_actual)
        if factura.get('estado') != 'EMITIDA':
            raise AppError("Solo facturas EMITIDAS pueden anularse", 400, "VAL_ERROR")
        
        return self.core.actualizar_factura(id, {
            "estado": "ANULADA",
            "razon_anulacion": datos.razon_anulacion
        })

    # =================================================================
    # DETALLES
    # =================================================================

    def listar_detalles(self, factura_id: UUID, usuario_actual: dict):
        self.obtener_factura(factura_id, usuario_actual)
        return self.core.repo.listar_detalles(factura_id)

    def agregar_detalle(self, datos_dict: dict, usuario_actual: dict):
        factura = self.obtener_factura(datos_dict['factura_id'], usuario_actual)
        self._validar_estado_borrador(factura)
        
        # Calcular subtotal y valor_iva si no están presentes
        if datos_dict.get('subtotal') is None or datos_dict.get('valor_iva') is None:
            cantidad = float(datos_dict.get('cantidad', 0))
            precio_unitario = float(datos_dict.get('precio_unitario', 0))
            descuento = float(datos_dict.get('descuento', 0))
            tipo_iva = datos_dict.get('tipo_iva', '0')
            
            # Calcular subtotal (cantidad * precio - descuento)
            subtotal = (cantidad * precio_unitario) - descuento
            datos_dict['subtotal'] = round(subtotal, 2)
            
            # Calcular valor_iva según tarifa
            # Tarifas SRI Ecuador: '0'=0%, '2'=12%, '3'=14%, '4'=15%
            tarifas_iva = {
                '0': 0.00,
                '2': 0.12,
                '3': 0.14,
                '4': 0.15
            }
            tasa_iva = tarifas_iva.get(tipo_iva, 0.00)
            valor_iva = subtotal * tasa_iva
            datos_dict['valor_iva'] = round(valor_iva, 2)
        
        detalle = self.core.repo.crear_detalle(datos_dict)
        self.core.recalcular_totales(datos_dict['factura_id'])
        return detalle

    def actualizar_detalle(self, id: UUID, datos_dict: dict, usuario_actual: dict):
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura = self.obtener_factura(detalle['factura_id'], usuario_actual)
        self._validar_estado_borrador(factura)
        res = self.core.repo.actualizar_detalle(id, datos_dict)
        self.core.recalcular_totales(detalle['factura_id'])
        return res

    def eliminar_detalle(self, id: UUID, usuario_actual: dict):
        detalle = self.core.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404)
        factura_id = detalle['factura_id']
        factura = self.obtener_factura(factura_id, usuario_actual)
        self._validar_estado_borrador(factura)
        res = self.core.repo.eliminar_detalle(id)
        self.core.recalcular_totales(factura_id)
        return res

    # =================================================================
    # SRI AUDIT & EMISSION
    # =================================================================

    def registrar_autorizacion_sri(self, datos: AutorizacionSRICreacion, usuario_actual: dict):
        factura = self.obtener_factura(datos.factura_id, usuario_actual)
        res = self.sri_facturacion.registrar_autorizacion_final(datos)
        
        update_data = {
            "estado": "EMITIDA",
            "clave_acceso": datos.numero_autorizacion,
            "numero_autorizacion": datos.numero_autorizacion,
            "fecha_autorizacion": datos.fecha_autorizacion
        }
        self.core.actualizar_factura(datos.factura_id, update_data)
        return res

    def registrar_intento_emision(self, datos: LogEmisionCreacion, usuario_actual: dict):
        self.obtener_factura(datos.factura_id, usuario_actual)
        return self.sri_facturacion.registrar_intento_emision(datos)

    def emitir_sri(self, id: UUID, usuario_actual: dict):
        """Procesa el envío real al SRI."""
        # Resolver usuario_id de facturación si no es superadmin
        usuario_contexto = usuario_actual.copy()
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            auth_user_id = usuario_actual.get("id")
            usuario_facturacion = self.usuario_repo.obtener_por_user_id(auth_user_id)
            if not usuario_facturacion:
                raise AppError("Usuario no encontrado en sistema de facturación", 404, "USUARIO_NOT_FOUND")
            # Inyectar el ID correcto para que los logs funcionen con la FK correcta
            usuario_contexto["id"] = usuario_facturacion['id']
            
        factura = self.obtener_factura(id, usuario_actual)
        # Validaciones previas a emitir
        if factura['estado'] != 'BORRADOR':
             raise AppError("La factura ya fue emitida o anulada", 400)

        # --- ASIGNACIÓN DE SECUENCIAL COMPENSATORIO (Justo a tiempo) ---
        if not factura.get('numero_factura'):
            print(f"--- [SERVICE] Asignando número secuencial a factura {id} ---")
            
            # Recuperar datos para el formato del número
            punto = self.core.punto_emision_service.obtener_punto(factura['punto_emision_id'], usuario_actual)
            establecimiento = self.core.establecimiento_service.obtener_establecimiento(factura['establecimiento_id'], usuario_actual)
            
            # Incrementar y obtener secuencial oficial
            secuencial = self.core.punto_emision_repo.incrementar_secuencial(factura['punto_emision_id'])
            if secuencial is None:
                raise AppError("No se pudo obtener el secuencial del punto de emisión", 500)
            
            numero_factura = f"{establecimiento['codigo']}-{punto['codigo']}-{secuencial:09d}"
            
            # Actualizar campos en BD
            update_data = {
                "numero_factura": numero_factura,
                "secuencial_punto_emision": secuencial
            }
            
            # Actualizar también el snapshot del punto de emisión (para consistencia RIDE)
            snapshot_pto = factura.get('snapshot_punto_emision', {})
            snapshot_pto['secuencial_usado'] = secuencial
            update_data['snapshot_punto_emision'] = snapshot_pto
            
            self.core.actualizar_factura(id, update_data)
            print(f"Factura {id} ahora tiene el número {numero_factura}. Procediendo al SRI...")
        
        return self.sri_facturacion.emitir_factura(id, usuario_contexto)

    def obtener_historial_emision(self, factura_id: UUID, usuario_actual: dict):
        self.obtener_factura(factura_id, usuario_actual)
        return self.sri_facturacion.obtener_historial_emision(factura_id)

    # =================================================================
    # PAGOS Y COBRANZAS
    # =================================================================

    def registrar_pago(self, datos: LogPagoCreacion, usuario_actual: dict):
        self.obtener_factura(datos.factura_id, usuario_actual)
        usuario_id = UUID(str(usuario_actual.get("id")))
        return self.pagos_factura.registrar_pago(datos, usuario_id)

    def obtener_resumen_pagos(self, factura_id: UUID, usuario_actual: dict):
        self.obtener_factura(factura_id, usuario_actual)
        return self.pagos_factura.obtener_resumen(factura_id)

    def listar_pagos(self, factura_id: UUID, usuario_actual: dict):
        self.obtener_factura(factura_id, usuario_actual)
        return self.pagos_factura.listar_pagos(factura_id)

    # =================================================================
    # FACTURACIÓN PROGRAMADA (RECURRENTE)
    # =================================================================

    def crear_programacion(self, datos: FacturacionProgramadaCreacion, usuario_actual: dict):
        self._validar_rol_operativo(usuario_actual)
        return self.recurrentes.crear_programacion(datos, usuario_actual)

    def obtener_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.obtener_programacion(id, usuario_actual)

    def listar_programaciones(self, usuario_actual: dict, activo: Optional[bool] = None):
        return self.recurrentes.listar_programaciones(usuario_actual, activo)

    def actualizar_programacion(self, id: UUID, datos: FacturacionProgramadaActualizacion, usuario_actual: dict):
        return self.recurrentes.actualizar_programacion(id, datos, usuario_actual)

    def eliminar_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.eliminar_programacion(id, usuario_actual)
