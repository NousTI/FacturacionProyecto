from fastapi import Depends
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional
import logging

from .repository import RepositorioComisiones
from .schemas import ComisionCreacion, ComisionActualizacion
from ..configuracion.service import ServicioConfiguracion
from ..empresas.repositories import RepositorioEmpresas
from ..vendedores.repositories import RepositorioVendedores
from ...constants.enums import AuthKeys, CommissionStatus
from ...errors.app_error import AppError
from .repository_log import RepositorioComisionLog

logger = logging.getLogger("facturacion_api")

class ServicioComisiones:
    def __init__(
        self,
        repo: RepositorioComisiones = Depends(),
        empresa_repo: RepositorioEmpresas = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        log_repo: RepositorioComisionLog = Depends(),
        config_service: ServicioConfiguracion = Depends()
    ):
        self.repo = repo
        self.empresa_repo = empresa_repo
        self.vendedor_repo = vendedor_repo
        self.log_repo = log_repo
        self.config_service = config_service

    def _crear_snapshot(self, comision: dict, responsable: dict = None, estado_anterior: str = None, estado_nuevo: str = None) -> dict:
        """Creates a detailed snapshot of the commission state for audit logs."""
        snapshot = {
            "comision": {
                "id": str(comision.get('id')),
                "estado": comision.get('estado'),
                "estado_anterior": estado_anterior,
                "estado_nuevo": estado_nuevo
            },
            "valores": {
                "monto": float(comision.get('monto') or 0),
                "porcentaje_aplicado": float(comision.get('porcentaje_aplicado') or 0),
                "monto_pago": float(comision.get('monto_pago') or 0)
            },
            "fechas": {
                "fecha_generacion": comision.get('fecha_generacion').isoformat() if isinstance(comision.get('fecha_generacion'), (date, datetime)) else comision.get('fecha_generacion'),
                "fecha_aprobacion": comision.get('fecha_aprobacion').isoformat() if isinstance(comision.get('fecha_aprobacion'), (date, datetime)) else comision.get('fecha_aprobacion'),
                "fecha_pago": comision.get('fecha_pago').isoformat() if isinstance(comision.get('fecha_pago'), (date, datetime)) else comision.get('fecha_pago')
            },
            "vendedor": {
                "id": str(comision.get('vendedor_id')),
                "nombre": f"{comision.get('vendedor_nombres', '')} {comision.get('vendedor_apellidos', '')}".strip() or comision.get('vendedor_nombre'),
                "identificacion": comision.get('documento_identidad'),
                "email": comision.get('vendedor_email')
            },
            "empresa": {
                "razon_social": comision.get('empresa_nombre')
            },
            "pago": {
                "metodo_pago": comision.get('metodo_pago'),
                "referencia": comision.get('numero_operacion')
            },
            "created_at": datetime.now().isoformat()
        }

        if responsable:
            snapshot["responsable"] = {
                "id": str(responsable.get('id')),
                "nombre": f"{responsable.get('nombres', '')} {responsable.get('apellidos', '')}".strip(),
                "rol": "SUPERADMIN" if responsable.get(AuthKeys.IS_SUPERADMIN) else "VENDEDOR",
                "email": responsable.get('email')
            }

        return snapshot

    def calcular_comision_potencial(self, empresa_id: UUID, monto_pago: float) -> Optional[dict]:
        logger.info(f"[INICIO] Calculando comisión potencial - empresa: {empresa_id}, monto: {monto_pago}")
        empresa = self.empresa_repo.obtener_por_id(empresa_id)
        if not empresa or not empresa.get('vendedor_id'):
            logger.warning(f"[VALIDACIÓN] Empresa sin vendedor asignado")
            return None
            
        vendedor = self.vendedor_repo.obtener_por_id(empresa['vendedor_id'])
        if not vendedor: return None

        tipo = (vendedor.get('tipo_comision') or 'PORCENTAJE').upper()
        
        if tipo == 'FIJO':
            monto = float(vendedor.get('porcentaje_comision') or 0)
            porcentaje = 0
        else:
            # Lógica Inicial vs Recurrente
            count_previos = self.repo.contar_pagos_previos_empresa(empresa_id)
            
            p_inicial = float(vendedor.get('porcentaje_comision_inicial') or 0)
            p_recurrente = float(vendedor.get('porcentaje_comision_recurrente') or 0)
            p_base = float(vendedor.get('porcentaje_comision') or 10) # Default 10%

            if count_previos == 0 and p_inicial > 0:
                porcentaje = p_inicial
            elif count_previos > 0 and p_recurrente > 0:
                porcentaje = p_recurrente
            else:
                porcentaje = p_base

            monto = float(monto_pago) * (porcentaje / 100.0)
            
        return {
            "vendedor_id": vendedor['id'],
            "monto": round(monto, 2),
            "porcentaje_aplicado": porcentaje,
            "estado": "PENDIENTE",
            "fecha_generacion": date.today()
        }

    def obtener_stats(self, usuario_actual: dict):
        logger.info("[INICIO] Obteniendo estadísticas de comisiones")
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        vendedor_id = None
        
        if not is_superadmin:
            # Si es vendedor, solo ve sus stats
            if usuario_actual.get(AuthKeys.IS_VENDEDOR):
                vendedor = self.vendedor_repo.obtener_por_user_id(usuario_actual['id'])
                if not vendedor:
                    logger.warning("[VALIDACIÓN] Perfil de vendedor no encontrado")
                    raise AppError("Perfil de vendedor no encontrado", 403)
                vendedor_id = vendedor['id']
            else:
                logger.warning("[VALIDACIÓN] Usuario no autorizado para ver estadísticas")
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
        
        result = self.repo.obtener_stats(vendedor_id)
        logger.info(f"[ÉXITO] Estadísticas obtenidas")
        return result

    def listar_comisiones(self, usuario_actual: dict):
        logger.info("[INICIO] Listando comisiones")
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if is_superadmin:
            result = self.repo.listar_comisiones()
            logger.info(f"[ÉXITO] Comisiones listadas: {len(result)} registros")
            return result
        if is_vendedor:
            vendedor = self.vendedor_repo.obtener_por_user_id(usuario_actual['id'])
            if not vendedor:
                logger.warning("[VALIDACIÓN] Perfil de vendedor no encontrado")
                raise AppError("Perfil de vendedor no encontrado", 403)
            result = self.repo.listar_comisiones(vendedor_id=vendedor['id'])
            logger.info(f"[ÉXITO] Comisiones del vendedor listadas: {len(result)} registros")
            return result
        
        logger.warning("[VALIDACIÓN] Usuario no autorizado para listar comisiones")
        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def obtener_comision(self, id: UUID, usuario_actual: dict):
        logger.info(f"[INICIO] Obteniendo comisión: {id}")
        comision = self.repo.obtener_por_id(id)
        if not comision:
            logger.warning(f"[VALIDACIÓN] Comisión no encontrada: {id}")
            raise AppError("Comisión no encontrada", 404, "COMISION_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            vendedor = self.vendedor_repo.obtener_por_user_id(usuario_actual['id'])
            if not vendedor or str(comision['vendedor_id']) != str(vendedor['id']):
                logger.warning(f"[VALIDACIÓN] Acceso denegado a comisión")
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
        
        logger.info(f"[ÉXITO] Comisión obtenida - ID: {id}")
        return comision

    def crear_manual(self, datos: ComisionCreacion, usuario_actual: dict):
        logger.info(f"[CREAR] Iniciando creación manual de comisión")
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            logger.warning("[VALIDACIÓN] Usuario sin permisos para crear comisiones")
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        
        nueva = self.repo.crear_comision(datos.model_dump())
        if nueva:
            logger.info(f"[ÉXITO] Comisión creada - ID: {nueva['id']}")
            # Re-fetch with joins for snapshot enrichment
            comision_full = self.repo.obtener_por_id(nueva['id'])
            snapshot = self._crear_snapshot(
                comision=comision_full, 
                responsable=usuario_actual,
                estado_nuevo='PENDIENTE'
            )
            self.log_repo.registrar_log(
                comision_id=nueva['id'],
                estado_anterior=None,
                estado_nuevo='PENDIENTE',
                snapshot=snapshot,
                responsable_id=usuario_actual['id'],
                rol_responsable='SUPERADMIN',
                observaciones="Creación manual de comisión"
            )
            logger.info(f"[CREAR] Comisión registrada en log")
        return nueva

    def actualizar(self, id: UUID, datos: ComisionActualizacion, usuario_actual: dict):
        logger.info(f"[EDITAR] Iniciando actualización de comisión: {id}")
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            logger.warning("[VALIDACIÓN] Usuario sin permisos para actualizar comisiones")
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
            
        # 1. Fetch previous state for logging
        comision_anterior = self.repo.obtener_por_id(id)
        if not comision_anterior:
            logger.warning(f"[VALIDACIÓN] Comisión no encontrada: {id}")
            raise AppError("Comisión no encontrada", 404, "COMISION_NOT_FOUND")

        update_data = datos.model_dump(exclude_unset=True)
        estado_nuevo = update_data.get('estado')
        
        # Prevent duplicate updates
        if estado_nuevo and comision_anterior['estado'] == estado_nuevo:
             return comision_anterior

        # Inject approval metadata
        if estado_nuevo == CommissionStatus.APROBADA:
            update_data['aprobado_por'] = usuario_actual['id']
            update_data['fecha_aprobacion'] = datetime.now()
            
        updated = self.repo.actualizar_comision(id, update_data)
        
        # 2. Log if state changed
        if updated and estado_nuevo and estado_nuevo != comision_anterior['estado']:
            # Re-fetch updated for accurate snapshot
            comision_nueva = self.repo.obtener_por_id(id)
            snapshot = self._crear_snapshot(
                comision=comision_nueva, 
                responsable=usuario_actual,
                estado_anterior=comision_anterior['estado'],
                estado_nuevo=estado_nuevo
            )
            self.log_repo.registrar_log(
                comision_id=id,
                estado_anterior=comision_anterior['estado'],
                estado_nuevo=estado_nuevo,
                snapshot=snapshot,
                responsable_id=usuario_actual['id'],
                rol_responsable='SUPERADMIN',
                observaciones=update_data.get('observaciones')
            )
            
        if updated:
            return self.repo.obtener_por_id(id)
        return None

    def registerPayment(self, ids: List[UUID], details: dict, usuario_actual: dict):
        if len(ids) == 1:
            # 1. Fetch previous state
            comision_anterior = self.repo.obtener_por_id(ids[0])
            if not comision_anterior:
                return None
            
            # Prevent duplicate payment
            if comision_anterior['estado'] == CommissionStatus.PAGADA.value:
                return True

            update_dict = {
                "estado": CommissionStatus.PAGADA.value,
                "fecha_pago": date.today(),
                **details
            }
            updated = self.repo.actualizar_comision(ids[0], update_dict)
            
            if updated:
                # 2. Log change
                comision_nueva = self.repo.obtener_por_id(ids[0])
                snapshot = self._crear_snapshot(
                    comision=comision_nueva, 
                    responsable=usuario_actual,
                    estado_anterior=comision_anterior['estado'],
                    estado_nuevo=CommissionStatus.PAGADA.value
                )
                self.log_repo.registrar_log(
                    comision_id=ids[0],
                    estado_anterior=comision_anterior['estado'],
                    estado_nuevo=CommissionStatus.PAGADA.value,
                    snapshot=snapshot,
                    responsable_id=usuario_actual['id'],
                    rol_responsable='SUPERADMIN',
                    observaciones=details.get('observaciones')
                )
                return True
        return False

    def obtener_historial(self, id: UUID, usuario_actual: dict):
        # Verify access rights
        self.obtener_comision(id, usuario_actual)
        return self.log_repo.obtener_por_comision(id)

    def eliminar(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.eliminar_comision(id)
