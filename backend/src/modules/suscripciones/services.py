from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from .repositories import RepositorioSuscripciones
from .schemas import PlanCreacion, PagoSuscripcionCreacion, PagoSuscripcionQuick
from ..comisiones.service import ServicioComisiones
from ..modulos.service import ServicioModulos
from ..empresas.repositories import RepositorioEmpresas
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class ServicioSuscripciones:
    def __init__(
        self,
        repo: RepositorioSuscripciones = Depends(),
        comision_service: ServicioComisiones = Depends(),
        modulo_service: ServicioModulos = Depends(),
        empresa_repo: RepositorioEmpresas = Depends()
    ):
        self.repo = repo
        self.comision_service = comision_service
        self.modulo_service = modulo_service
        self.empresa_repo = empresa_repo

    def listar_planes(self):
        return self.repo.listar_planes()

    def obtener_plan(self, id: UUID):
        return self.repo.obtener_plan_por_id(id)

    def crear_plan(self, data: PlanCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
        return self.repo.crear_plan(data.model_dump())

    def actualizar_plan(self, id: UUID, data: any, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
        plan = self.repo.actualizar_plan(id, data.model_dump(exclude_unset=True))
        if not plan:
            raise AppError("Plan no encontrado", 404)
        return plan

    def eliminar_plan(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
        return self.repo.eliminar_plan(id)

    def listar_empresas_por_plan(self, plan_id: UUID, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if not is_superadmin and not is_vendedor:
            raise AppError("No autorizado", 403)
            
        vendedor_id = None
        if is_vendedor:
            vendedor_id = self._obtener_vendedor_id_actual(usuario_actual)
                
        return self.repo.listar_empresas_por_plan(plan_id, vendedor_id)

    def obtener_stats_dashboard(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
        return self.repo.obtener_stats_dashboard()

    def registrar_pago_rapido(self, data: PagoSuscripcionQuick, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)

        if not is_superadmin and not is_vendedor:
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        # Ownership check for vendors
        if is_vendedor:
            empresa = self.empresa_repo.obtener_por_id(data.empresa_id)
            if not empresa: raise AppError("Empresa no encontrada", 404)
            
            # We need to find the vendor profile for this user
            from ..vendedores.repositories import RepositorioVendedores
            # Note: This is a bit circular if we don't have access to repo here, 
            # but ServicioSuscripciones already has self.empresa_repo
            vendedor_id = empresa.get('vendedor_id')
            
            # Get the user's vendor profile id
            # Note: The easiest way is to check the user context if it was already enriched, 
            # but here we might need to fetch it.
            # Assuming we can trust the 'vendedor_id' in the company matches the logged in vendor.
            # Let's verify via the user's id.
            # Get the user's vendor profile id
            vendedor_id_actual = self._obtener_vendedor_id_actual(usuario_actual)
            if str(vendedor_id_actual) != str(vendedor_id):
                raise AppError("No autorizado: Esta empresa no está bajo tu gestión", 403, "AUTH_FORBIDDEN")

        plan = self.repo.obtener_plan_por_id(data.plan_id)
        if not plan: raise AppError("Plan no encontrado", 404)
        
        # Verificar que no sea el mismo plan actual
        current_sub = self.repo.obtener_suscripcion_por_empresa(data.empresa_id)
        if current_sub and str(current_sub['plan_id']) == str(data.plan_id) and current_sub['estado'] == 'ACTIVA':
            raise AppError(
                message="Plan ya activo",
                status_code=400,
                code="SUBSCRIPTION_ALREADY_ACTIVE",
                description=f"La empresa ya cuenta con el plan '{plan['nombre']}' activo."
            )
        
        monto = data.monto or plan['precio_mensual']
        fecha_inicio = data.fecha_inicio_periodo or datetime.now()
        fecha_fin = data.fecha_fin_periodo or (fecha_inicio + timedelta(days=30))
        
        pago_dict = {
            "empresa_id": data.empresa_id,
            "plan_id": data.plan_id,
            "monto": monto,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": fecha_inicio,
            "fecha_fin_periodo": fecha_fin,
            "metodo_pago": data.metodo_pago,
            "estado": "PAGADO",
            "numero_comprobante": data.numero_comprobante,
            "registrado_por": usuario_actual['id']
        }
        
        empresa_data = {
            "id": data.empresa_id,
            "fecha_activacion": fecha_inicio,
            "fecha_vencimiento": fecha_fin,
            "estado": "ACTIVA"
        }
        
        comision = self.comision_service.calcular_comision_potencial(data.empresa_id, float(monto))
        
        pago_id = self.repo.registrar_suscripcion_atomica(pago_dict, empresa_data, comision)
        
        # Sincronizar módulos
        self.modulo_service.sincronizar(data.empresa_id, data.plan_id, fecha_fin)
        
        return {"id": pago_id, "mensaje": "Pago registrado y suscripción activada"}

    def listar_pagos(self, usuario_actual: dict, empresa_id_filtro: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        # 1. Superadmin: Puede ver todo o filtrar por empresa
        if is_superadmin:
            return self.repo.listar_pagos(empresa_id_filtro)
            
        # 2. Vendedor: Solo ve empresas asignadas
        if is_vendedor:
            vendedor_id = self._obtener_vendedor_id_actual(usuario_actual)
            
            if empresa_id_filtro:
                # Validar que la empresa filtrada pertenezca al vendedor
                empresa = self.empresa_repo.obtener_por_id(empresa_id_filtro)
                if not empresa:
                    raise AppError("Empresa no encontrada", 404)
                
                if str(empresa.get('vendedor_id')) != str(vendedor_id):
                    raise AppError("No autorizado para ver el historial de esta empresa", 403)
                
                return self.repo.listar_pagos(empresa_id=empresa_id_filtro)
            else:
                # Ver todos los pagos de todas sus empresas
                return self.repo.listar_pagos(vendedor_id=vendedor_id)

        # 3. Usuario Regular: Solo ve su propia empresa
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            return []
            
        return self.repo.listar_pagos(empresa_id)

    def _obtener_vendedor_id_actual(self, usuario_actual: dict) -> UUID:
        query = "SELECT id FROM sistema_facturacion.vendedores WHERE user_id = %s"
        with self.repo.db.cursor() as cur:
            cur.execute(query, (str(usuario_actual['id']),))
            row = cur.fetchone()
            if not row:
                raise AppError("Perfil de vendedor no encontrado", 403)
            return row['id']

    def obtener_historial_suscripcion(self, empresa_id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(empresa_id) != str(usuario_actual.get('empresa_id')):
                raise AppError('No autorizado', 403)
        suscripcion = self.repo.obtener_suscripcion_por_empresa(empresa_id)
        if not suscripcion:
            raise AppError('Suscripcion no encontrada', 404)
        return self.repo.obtener_historial_suscripcion(suscripcion['id'])

    def activar_suscripcion(self, empresa_id: UUID, plan_id: UUID, fecha_inicio: datetime, fecha_fin: datetime, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
            
        current = self.repo.obtener_suscripcion_por_empresa(empresa_id)
        
        data = {
            "empresa_id": str(empresa_id),
            "plan_id": str(plan_id),
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "estado": "ACTIVA",
            "actualizado_por": str(usuario_actual['id'])
        }
        
        updated = self.repo.crear_suscripcion(data)
        
        # Log entry
        log_data = {
            "suscripcion_id": str(updated['id']),
            "estado_anterior": current['estado'] if current else None,
            "estado_nuevo": "ACTIVA",
            "plan_anterior": str(current['plan_id']) if current else None,
            "plan_nuevo": str(plan_id),
            "fecha_inicio_anterior": current['fecha_inicio'] if current else None,
            "fecha_fin_anterior": current['fecha_fin'] if current else None,
            "fecha_inicio_nuevo": fecha_inicio,
            "fecha_fin_nuevo": fecha_fin,
            "cambiado_por": str(usuario_actual['id']),
            "origen": "ADMIN",
            "motivo": "Activación manual por administrador"
        }
        self.repo.registrar_log_suscripcion(log_data)
        
        # Sincronizar módulos
        self.modulo_service.sincronizar(empresa_id, plan_id, fecha_fin)
        
        return updated

    def cancelar_suscripcion(self, empresa_id: UUID, observaciones: str, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
            
        current = self.repo.obtener_suscripcion_por_empresa(empresa_id)
        if not current:
            raise AppError("Suscripción no encontrada", 404)
            
        data = {
            "empresa_id": str(empresa_id),
            "plan_id": str(current['plan_id']),
            "fecha_inicio": current['fecha_inicio'],
            "fecha_fin": current['fecha_fin'],
            "estado": "CANCELADA",
            "actualizado_por": str(usuario_actual['id']),
            "observaciones": observaciones
        }
        
        updated = self.repo.crear_suscripcion(data)
        
        log_data = {
            "suscripcion_id": str(updated['id']),
            "estado_anterior": current['estado'],
            "estado_nuevo": "CANCELADA",
            "plan_anterior": str(current['plan_id']),
            "plan_nuevo": str(current['plan_id']),
            "fecha_inicio_anterior": current['fecha_inicio'],
            "fecha_fin_anterior": current['fecha_fin'],
            "fecha_inicio_nuevo": current['fecha_inicio'],
            "fecha_fin_nuevo": current['fecha_fin'],
            "cambiado_por": str(usuario_actual['id']),
            "origen": "ADMIN",
            "motivo": observaciones
        }
        self.repo.registrar_log_suscripcion(log_data)
        
        return updated

    def suspender_suscripcion(self, empresa_id: UUID, observaciones: str, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
            
        current = self.repo.obtener_suscripcion_por_empresa(empresa_id)
        if not current:
            raise AppError("Suscripción no encontrada", 404)
            
        data = {
            "empresa_id": str(empresa_id),
            "plan_id": str(current['plan_id']),
            "fecha_inicio": current['fecha_inicio'],
            "fecha_fin": current['fecha_fin'],
            "estado": "SUSPENDIDA",
            "actualizado_por": str(usuario_actual['id']),
            "observaciones": observaciones
        }
        
        updated = self.repo.crear_suscripcion(data)
        
        log_data = {
            "suscripcion_id": str(updated['id']),
            "estado_anterior": current['estado'],
            "estado_nuevo": "SUSPENDIDA",
            "plan_anterior": str(current['plan_id']),
            "plan_nuevo": str(current['plan_id']),
            "fecha_inicio_anterior": current['fecha_inicio'],
            "fecha_fin_anterior": current['fecha_fin'],
            "fecha_inicio_nuevo": current['fecha_inicio'],
            "fecha_fin_nuevo": current['fecha_fin'],
            "cambiado_por": str(usuario_actual['id']),
            "origen": "ADMIN",
            "motivo": observaciones
        }
        self.repo.registrar_log_suscripcion(log_data)
        
        return updated

    def verificar_vencimientos(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
            
        # Lógica para marcar como vencidas las suscripciones que pasaron su fecha fin
        # Esto usualmente se haría en un cron job, pero aquí se expone vía API
        query = """
            SELECT s.* 
            FROM sistema_facturacion.suscripciones s
            WHERE s.estado = 'ACTIVA' AND s.fecha_fin < NOW()
        """
        vencidas = []
        with self.repo.db.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            for row in rows:
                vencidas.append(dict(row))
        
        count = 0
        for s in vencidas:
            data = {
                "empresa_id": str(s['empresa_id']),
                "plan_id": str(s['plan_id']),
                "fecha_inicio": s['fecha_inicio'],
                "fecha_fin": s['fecha_fin'],
                "estado": "VENCIDA",
                "actualizado_por": str(usuario_actual['id'])
            }
            self.repo.crear_suscripcion(data)
            
            log_data = {
                "suscripcion_id": str(s['id']),
                "estado_anterior": s['estado'],
                "estado_nuevo": "VENCIDA",
                "plan_anterior": str(s['plan_id']),
                "plan_nuevo": str(s['plan_id']),
                "fecha_inicio_anterior": s['fecha_inicio'],
                "fecha_fin_anterior": s['fecha_fin'],
                "fecha_inicio_nuevo": s['fecha_inicio'],
                "fecha_fin_nuevo": s['fecha_fin'],
                "cambiado_por": str(usuario_actual['id']),
                "origen": "SISTEMA",
                "motivo": "Vencimiento automático de periodo"
            }
            self.repo.registrar_log_suscripcion(log_data)
            count += 1
            
        return {"procesados": count, "mensaje": f"Se marcaron {count} suscripciones como vencidas"}
