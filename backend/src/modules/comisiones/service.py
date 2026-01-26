from fastapi import Depends
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional

from .repository import RepositorioComisiones
from .schemas import ComisionCreacion, ComisionActualizacion
from ..configuracion.service import ServicioConfiguracion
from ..empresa.repository import RepositorioEmpresa
from ..vendedores.repository import RepositorioVendedores
from ...constants.enums import AuthKeys, CommissionStatus
from ...errors.app_error import AppError
from .repository_log import RepositorioComisionLog

class ServicioComisiones:
    def __init__(
        self,
        repo: RepositorioComisiones = Depends(),
        empresa_repo: RepositorioEmpresa = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        log_repo: RepositorioComisionLog = Depends(),
        config_service: ServicioConfiguracion = Depends()
    ):
        self.repo = repo
        self.empresa_repo = empresa_repo
        self.vendedor_repo = vendedor_repo
        self.log_repo = log_repo
        self.config_service = config_service

    def _crear_snapshot(self, comision: dict, responsable: dict = None) -> dict:
        """Creates a snapshot of critical data at the time of status change."""
        snapshot = {
            "id": str(comision.get('id')),
            "monto": float(comision.get('monto') or 0),
            "porcentaje_aplicado": float(comision.get('porcentaje_aplicado') or 0),
            "vendedor": {
                "id": str(comision.get('vendedor_id')),
                "nombres": comision.get('vendedor_nombres'),
                "apellidos": comision.get('vendedor_apellidos'),
                "email": comision.get('vendedor_email'),
                "telefono": comision.get('telefono'),
                "documento_identidad": comision.get('documento_identidad')
            },
            "empresa": {
                "nombre": comision.get('empresa_nombre')
            },
            "pago_suscripcion_id": str(comision.get('pago_suscripcion_id')),
            "updated_at": datetime.now().isoformat()
        }

        if responsable:
            snapshot["responsable"] = {
                "nombres": responsable.get('nombres'),
                "apellidos": responsable.get('apellidos'),
                "email": responsable.get('email')
            }

        return snapshot

    def calcular_comision_potencial(self, empresa_id: UUID, monto_pago: float) -> Optional[dict]:
        empresa = self.empresa_repo.obtener_por_id(empresa_id)
        if not empresa or not empresa.get('vendedor_id'):
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
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        vendedor_id = None
        
        if not is_superadmin:
            # Si es vendedor, solo ve sus stats
            if usuario_actual.get(AuthKeys.IS_VENDEDOR):
                vendedor_id = usuario_actual['id']
            else:
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                
        return self.repo.obtener_stats(vendedor_id)

    def listar_comisiones(self, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if is_superadmin:
            return self.repo.listar_comisiones()
        if is_vendedor:
            return self.repo.listar_comisiones(vendedor_id=usuario_actual['id'])
        
        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def obtener_comision(self, id: UUID, usuario_actual: dict):
        comision = self.repo.obtener_por_id(id)
        if not comision: raise AppError("Comisión no encontrada", 404, "COMISION_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(comision['vendedor_id']) != str(usuario_actual['id']):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return comision

    def crear_manual(self, datos: ComisionCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.crear_comision(datos.model_dump())

    def actualizar(self, id: UUID, datos: ComisionActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
            
        # 1. Fetch previous state for logging
        comision_anterior = self.repo.obtener_por_id(id)
        if not comision_anterior: raise AppError("Comisión no encontrada", 404, "COMISION_NOT_FOUND")

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
            snapshot = self._crear_snapshot(comision_anterior, responsable=usuario_actual)
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
                snapshot = self._crear_snapshot(comision_anterior, responsable=usuario_actual)
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
