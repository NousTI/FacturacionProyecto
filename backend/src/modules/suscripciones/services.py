from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from .repositories import RepositorioSuscripciones
from .schemas import PlanCreacion, PagoSuscripcionCreacion, PagoSuscripcionQuick, ReactivacionEmpresa
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

    def listar_planes(self, usuario_actual: dict = None):
        """List plans. If vendor, filter to show only their companies' plans"""
        planes = self.repo.listar_planes()

        # Si es vendedor, filtrar planes para mostrar solo count de sus empresas
        if usuario_actual and usuario_actual.get(AuthKeys.IS_VENDEDOR):
            vendedor_id = self._obtener_vendedor_id_actual(usuario_actual)
            # Actualizar el conteo de empresas solo para las del vendedor
            for plan in planes:
                # Contar empresas del vendedor en este plan
                query = """
                    SELECT COUNT(*) as count FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE s.plan_id = %s AND e.vendedor_id = %s
                """
                with self.repo.db.cursor() as cur:
                    cur.execute(query, (str(plan['id']), str(vendedor_id)))
                    row = cur.fetchone()
                    plan['active_companies'] = row['count'] if row else 0

        return planes

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
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if not is_superadmin and not is_vendedor:
            raise AppError("No autorizado", 403)
            
        vendedor_id = None
        if is_vendedor:
            vendedor_id = self._obtener_vendedor_id_actual(usuario_actual)
            
        return self.repo.obtener_stats_dashboard(vendedor_id)

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
        
        # Verificar que no sea el mismo plan actual y esté activo
        current_sub = self.repo.obtener_suscripcion_por_empresa(data.empresa_id)
        
        # Validación 1: Evitar duplicar el mismo plan si ya está activo
        if current_sub and str(current_sub['plan_id']) == str(data.plan_id) and current_sub['estado'] == 'ACTIVA':
            # Solo bloqueamos si la fecha de inicio del nuevo pago es ANTES del vencimiento actual
            # (Si es después, es una renovación legítima que se puede pre-registrar)
            if not data.fecha_inicio_periodo or data.fecha_inicio_periodo < current_sub['fecha_fin']:
                raise AppError(
                    message="Plan ya activo",
                    status_code=400,
                    code="SUBSCRIPTION_ALREADY_ACTIVE",
                    description=f"La empresa ya cuenta con el plan '{plan['nombre']}' activo hasta el {current_sub['fecha_fin'].strftime('%d/%m/%Y')}."
                )
        
        # Validación 2: Verificar solapamiento de periodos pagados
        fecha_inicio = data.fecha_inicio_periodo or datetime.now()
        
        # Buscar si existe algún pago que cubra la fecha de inicio propuesta
        pagos_existentes = self.repo.listar_pagos(empresa_id=data.empresa_id)
        
        # Normalizar fecha_inicio a naive para comparación
        fecha_inicio_comp = fecha_inicio.replace(tzinfo=None) if fecha_inicio.tzinfo else fecha_inicio

        for p in pagos_existentes:
            p_inicio = p['fecha_inicio_periodo']
            p_fin = p['fecha_fin_periodo']
            
            # Normalizar fechas de BD a naive
            if isinstance(p_inicio, datetime) and p_inicio.tzinfo:
                p_inicio = p_inicio.replace(tzinfo=None)
            if isinstance(p_fin, datetime) and p_fin.tzinfo:
                p_fin = p_fin.replace(tzinfo=None)

            if p['estado'] == 'PAGADO' and p_inicio <= fecha_inicio_comp < p_fin:
                logger.info(f"Checking overlap: existing plan={p['plan_id']}, requested plan={data.plan_id}")
                # Solo bloqueamos si es el MISMO plan. 
                if str(p['plan_id']) == str(data.plan_id):
                    logger.warning(f"Overlap detected for SAME plan {data.plan_id}, but allowing due to administrative action.")
                    # No lanzamos error, permitimos que el Superadmin registre múltiples pagos si es necesario 
                    # (ej: para corregir estados o registrar periodos adicionales)
                    pass

        monto = data.monto or plan['precio_anual']
        
        if data.fecha_fin_periodo:
            fecha_fin = data.fecha_fin_periodo
        else:
            try:
                # 24 Mar 2026 -> 24 Mar 2027 -> 23 Mar 2027
                fecha_fin = fecha_inicio.replace(year=fecha_inicio.year + 1) - timedelta(days=1)
            except ValueError:
                # 29 feb -> 28 feb del prox año
                fecha_fin = (fecha_inicio + timedelta(days=1)).replace(year=fecha_inicio.year + 1) - timedelta(days=2)
        
        # Clasificar tipo de pago
        count_previos = self.repo.contar_pagos_previos_empresa(data.empresa_id)
        if count_previos == 0:
            tipo_pago = "NUEVO"
        elif current_sub and str(current_sub['plan_id']) != str(data.plan_id):
            tipo_pago = "UPGRADE"
        else:
            tipo_pago = "RENOVACION"

        pago_dict = {
            "empresa_id": data.empresa_id,
            "plan_id": data.plan_id,
            "monto": monto,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": fecha_inicio,
            "fecha_fin_periodo": fecha_fin,
            "metodo_pago": data.metodo_pago,
            "estado": data.estado or "PAGADO",
            "numero_comprobante": data.numero_comprobante,
            "registrado_por": usuario_actual['id'],
            "tipo_pago": tipo_pago,
            "observaciones": data.observaciones
        }
        
        empresa_data = {
            "id": data.empresa_id,
            "fecha_activacion": fecha_inicio,
            "fecha_vencimiento": fecha_fin,
            "estado": "ACTIVA"
        }
        
        comision = None
        # Solo calcular comisión si está pagado. Si es pendiente, se calculará al confirmar.
        if (data.estado or "PAGADO") == "PAGADO":
            comision = self.comision_service.calcular_comision_potencial(data.empresa_id, float(monto))
        
        pago_id = self.repo.registrar_suscripcion_atomica(pago_dict, empresa_data, comision)
        
        # Sincronizar módulos (siempre lo hacemos para que el cliente no pierda acceso por temas administrativos)
        self.modulo_service.sincronizar(data.empresa_id, data.plan_id, fecha_fin)
        
        msg = "Pago registrado y suscripción activada" if pago_dict['estado'] == "PAGADO" else "Cobro pendiente registrado y suscripción actualizada"
        return {"id": pago_id, "mensaje": msg}

    def confirmar_pago(self, pago_id: UUID, numero_comprobante: str, metodo_pago: str, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and not usuario_actual.get(AuthKeys.IS_VENDEDOR):
            raise AppError("No autorizado", 403)
            
        pago = self.repo.obtener_pago_por_id(pago_id)
        if not pago: raise AppError("Pago no encontrado", 404)
        if pago['estado'] == 'PAGADO': raise AppError("El pago ya está confirmado", 400)
        
        # 1. Actualizar Pago
        pago_update = {
            "estado": "PAGADO",
            "numero_comprobante": numero_comprobante,
            "metodo_pago": metodo_pago,
            "fecha_pago": datetime.now()
        }
        
        # 2. Calcular y registrar comisión ahora que está pagado
        comision = self.comision_service.calcular_comision_potencial(pago['empresa_id'], float(pago['monto']))
        
        self.repo.confirmar_pago_atomico(pago_id, pago_update, comision)
        
        return {"mensaje": "Pago confirmado exitosamente y comisión generada"}

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
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if not is_superadmin:
            if is_vendedor:
                vendedor_id_actual = self._obtener_vendedor_id_actual(usuario_actual)
                empresa = self.empresa_repo.obtener_por_id(empresa_id)
                if not empresa or str(empresa.get('vendedor_id')) != str(vendedor_id_actual):
                    raise AppError('No autorizado: Esta empresa no está bajo tu gestión', 403)
            elif str(empresa_id) != str(usuario_actual.get('empresa_id')):
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

    def reactivar_empresa_rescate(self, empresa_id: UUID, datos: ReactivacionEmpresa, usuario_actual: dict):
        """Opción B: Registra pago, reactiva suscripción y restaura acceso a la empresa."""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)

        empresa = self.empresa_repo.obtener_por_id(empresa_id)
        if not empresa:
            raise AppError("Empresa no encontrada", 404)

        plan = self.repo.obtener_plan_por_id(datos.plan_id)
        if not plan:
            raise AppError("Plan no encontrado", 404)

        fecha_inicio = datos.fecha_inicio_periodo or datetime.now()
        if datos.fecha_fin_periodo:
            fecha_fin = datos.fecha_fin_periodo
        else:
            try:
                fecha_fin = fecha_inicio.replace(year=fecha_inicio.year + 1) - timedelta(days=1)
            except ValueError:
                fecha_fin = (fecha_inicio + timedelta(days=1)).replace(year=fecha_inicio.year + 1) - timedelta(days=2)

        pago_dict = {
            "empresa_id": empresa_id,
            "plan_id": datos.plan_id,
            "monto": datos.monto,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": fecha_inicio,
            "fecha_fin_periodo": fecha_fin,
            "metodo_pago": datos.metodo_pago,
            "estado": "PAGADO",
            "numero_comprobante": datos.numero_comprobante,
            "registrado_por": usuario_actual['id'],
            "tipo_pago": "REACTIVACION",
            "observaciones": datos.observaciones or "Reactivación desde Zona de Rescate"
        }

        empresa_data = {
            "id": empresa_id,
            "fecha_activacion": fecha_inicio,
            "fecha_vencimiento": fecha_fin,
            "estado": "ACTIVA"
        }

        comision = self.comision_service.calcular_comision_potencial(empresa_id, float(datos.monto))
        pago_id = self.repo.registrar_suscripcion_atomica(pago_dict, empresa_data, comision)

        # Restaurar acceso: empresa.activo = TRUE
        with self.repo.db.cursor() as cur:
            cur.execute(
                "UPDATE sistema_facturacion.empresas SET activo = TRUE, updated_at = NOW() WHERE id = %s",
                (str(empresa_id),)
            )
        self.repo.db.commit()

        # Sincronizar módulos del nuevo plan
        self.modulo_service.sincronizar(empresa_id, datos.plan_id, fecha_fin)

        logger.info(f"Empresa {empresa_id} reactivada desde Zona de Rescate por {usuario_actual['id']}")
        return {"pago_id": pago_id, "mensaje": "Empresa reactivada exitosamente. Acceso restaurado."}
