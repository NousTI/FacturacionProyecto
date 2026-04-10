from fastapi import Depends, HTTPException
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor
from .repositories import RepositorioRenovaciones
from .schemas import SolicitudRenovacionCreate, SolicitudRenovacionProcess
from ..notificaciones.services import ServicioNotificaciones
from ..notificaciones.schemas import NotificacionCreate
from ..suscripciones.repositories import RepositorioSuscripciones
# RealDictCursor se usa en los cursores dentro de los métodos

class ServicioRenovaciones:
    def __init__(self, 
                 repo: RepositorioRenovaciones = Depends(),
                 repo_suscripciones: RepositorioSuscripciones = Depends(),
                 notif_service: ServicioNotificaciones = Depends()):
        self.repo = repo
        self.repo_suscripciones = repo_suscripciones
        self.notif_service = notif_service

    def solicitar_renovacion(self, vendor_user_id: UUID, data: SolicitudRenovacionCreate) -> Optional[dict]:
        empresa_id = data.empresa_id
        
        # 1. Obtener ID del perfil de vendedor
        with self.repo.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM sistema_facturacion.vendedores WHERE user_id = %s", (str(vendor_user_id),))
            v_row = cur.fetchone()
            if not v_row:
                raise HTTPException(status_code=403, detail="Perfil de vendedor no encontrado.")
            vendedor_id_actual = v_row['id']

        # 2. Verificar que el vendedor gestione esta empresa
        with self.repo.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM sistema_facturacion.empresas WHERE id = %s AND vendedor_id = %s", (str(empresa_id), str(vendedor_id_actual)))
            e_row = cur.fetchone()
            if not e_row:
                raise HTTPException(status_code=403, detail="No tienes permisos para renovar esta empresa.")

        # 3. Verificar suscripción actual
        suscripcion = self.repo_suscripciones.obtener_suscripcion_por_empresa(empresa_id)
        if not suscripcion:
            raise HTTPException(status_code=404, detail="No se encontró una suscripción previa para esta empresa.")

        # Impedir renovar el mismo plan si la actual sigue activa y vigente
        from datetime import date, datetime
        hoy = date.today()
        # Normalizar fecha_fin a tipo date si es datetime
        fecha_fin = suscripcion['fecha_fin']
        if isinstance(fecha_fin, datetime):
            fecha_fin = fecha_fin.date()

        if suscripcion['estado'] == 'ACTIVA' and fecha_fin >= hoy:
            # Si es el mismo plan, no permitir. Debe ser cambio (upgrade o cambio de plan)
            if str(suscripcion['plan_id']) == str(data.plan_id):
                raise HTTPException(
                    status_code=400, 
                    detail="La empresa ya tiene una suscripción activa con este mismo plan. Solo puedes solicitar cambios si deseas un plan diferente."
                )

        # 4. Crear solicitud
        sol_data = {
            "empresa_id": empresa_id,
            "suscripcion_id": suscripcion['id'],
            "plan_id": data.plan_id,
            "vendedor_id": vendedor_id_actual,
            "comprobante_url": data.comprobante_url,
            "estado": "PENDIENTE"
        }
        nueva_solicitud = self.repo.crear_solicitud(sol_data)
        
        # 5. Notificar a Superadmins
        admin_user_ids = self.repo.listar_user_ids_superadmins()
        for admin_id in admin_user_ids:
            self.notif_service.crear_notificacion(NotificacionCreate(
                user_id=admin_id,
                titulo="Nueva Renovación de Vendedor",
                mensaje=f"Un vendedor ha solicitado renovar una empresa. Por favor revisa los detalles.",
                tipo="RENOVACION",
                prioridad="ALTA",
                metadata={"solicitud_id": str(nueva_solicitud['id'])}
            ))

        # 6. Notificar a Administradores de la Empresa
        empresa_admins = self.repo.listar_user_ids_admins_empresa(empresa_id)
        for emp_admin_id in empresa_admins:
            self.notif_service.crear_notificacion(NotificacionCreate(
                user_id=emp_admin_id,
                titulo="Solicitud de Renovación Iniciada",
                mensaje=f"Se ha iniciado una solicitud de renovación para tu empresa. Estamos procesando tu pedido.",
                tipo="RENOVACION",
                prioridad="MEDIA",
                metadata={"solicitud_id": str(nueva_solicitud['id'])}
            ))

        # 7. Notificar al Vendedor (Autonotificación)
        self.notif_service.crear_notificacion(NotificacionCreate(
            user_id=vendor_user_id,
            titulo="Solicitud Enviada",
            mensaje=f"Has enviado correctamente una solicitud de renovación para la empresa '{nueva_solicitud['empresa_nombre']}'.",
            tipo="RENOVACION",
            prioridad="BAJA",
            metadata={"solicitud_id": str(nueva_solicitud['id'])}
        ))

        return nueva_solicitud

    def procesar_solicitud(self, solicitud_id: UUID, superadmin_id: UUID, data: SolicitudRenovacionProcess) -> Optional[dict]:
        # 1. Obtener solicitud
        solicitud = self.repo.obtener_solicitud_por_id(solicitud_id)
        if not solicitud:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada.")
        
        if solicitud['estado'] != 'PENDIENTE':
            raise HTTPException(status_code=400, detail="Esta solicitud ya ha sido procesada.")

        empresa_id = solicitud['empresa_id']
        
        # 2. Actualizar estado de solicitud
        update_data = {
            "estado": data.estado,
            "procesado_por": superadmin_id,
            "motivo_rechazo": data.motivo_rechazo,
            "fecha_procesamiento": datetime.now()
        }
        
        if data.estado == 'ACEPTADA':
            # --- Lógica de Renovación ---
            plan = self.repo_suscripciones.obtener_plan_por_id(solicitud['plan_id'])
            if not plan:
                raise HTTPException(status_code=404, detail="Plan seleccionado no existe.")

            suscripcion_actual = self.repo_suscripciones.obtener_suscripcion_por_empresa(empresa_id)
            
            # Cálculo de fechas (siempre anual según la tabla planes)
            # Si la suscripción aún no vence, sumamos un año a la fecha_fin actual.
            # Si ya venció, empezamos desde hoy.
            base_date = suscripcion_actual['fecha_fin'] if suscripcion_actual and suscripcion_actual['fecha_fin'] > datetime.now().astimezone() else datetime.now()
            fecha_fin_nueva = base_date + timedelta(days=365)

            pago_data = {
                "empresa_id": str(empresa_id),
                "plan_id": str(solicitud['plan_id']),
                "monto": float(plan['precio_anual']),
                "metodo_pago": "TRANSFERENCIA", 
                "estado": "PAGADO",
                "fecha_pago": datetime.now(),
                "fecha_inicio_periodo": base_date,
                "fecha_fin_periodo": fecha_fin_nueva,
                "comprobante_url": solicitud.get('comprobante_url'),
                "registrado_por": str(superadmin_id),
                "observaciones": f"Renovación aprobada desde solicitud: {solicitud_id}"
            }

            empresa_data = {
                "id": str(empresa_id),
                "fecha_activacion": base_date,
                "fecha_vencimiento": fecha_fin_nueva,
                "estado": "ACTIVA"
            }

            comision_data = None
            if solicitud['vendedor_id']:
                # Obtener info del vendedor para calcular comision
                vendedor_full = self.repo.obtener_vendedor_por_empresa(empresa_id) # Ya lo tenemos o lo re-buscamos
                # Para simplificar, buscamos el porcentaje en la tabla vendedores
                with self.repo.db.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT porcentaje_comision_recurrente FROM sistema_facturacion.vendedores WHERE id = %s", (str(solicitud['vendedor_id']),))
                    v_row = cur.fetchone()
                    if v_row:
                        porcentaje = float(v_row['porcentaje_comision_recurrente'] or 0)
                        comision_data = {
                            "vendedor_id": str(solicitud['vendedor_id']),
                            "monto": float(plan['precio_anual']) * (porcentaje / 100),
                            "porcentaje_aplicado": porcentaje,
                            "estado": "PENDIENTE",
                            "observaciones": f"Comisión por renovación de {solicitud['empresa_nombre']}"
                        }

            # Ejecutar lógica atómica
            self.repo_suscripciones.registrar_suscripcion_atomica(pago_data, empresa_data, comision_data)

            # Notificar Empresa (A sus administradores)
            admin_ids = self.repo.listar_user_ids_admins_empresa(empresa_id)
            for admin_user_id in admin_ids:
                self.notif_service.crear_notificacion(NotificacionCreate(
                    user_id=admin_user_id,
                    titulo="Suscripción Renovada con Éxito",
                    mensaje=f"Tu renovación al plan {plan['nombre']} ha sido aprobada.",
                    tipo="RENOVACION",
                    prioridad="ALTA",
                    metadata={"suscripcion_id": str(suscripcion_actual['id'])}
                ))

            # Notificar Vendedor
            if solicitud['vendedor_id']:
                vendedor_info = self.repo.obtener_vendedor_por_empresa(empresa_id)
                if vendedor_info:
                    self.notif_service.crear_notificacion(NotificacionCreate(
                        user_id=vendedor_info['user_id'],
                        titulo="Renovación Aprobada",
                        mensaje=f"La renovación de la empresa '{solicitud['empresa_nombre']}' ha sido aprobada.",
                        tipo="RENOVACION",
                        prioridad="MEDIA",
                        metadata={"solicitud_id": str(solicitud_id)}
                    ))

            # Notificar a Superadmins (Visibilidad para todos)
            superadmin_ids = self.repo.listar_user_ids_superadmins()
            for sa_id in superadmin_ids:
                self.notif_service.crear_notificacion(NotificacionCreate(
                    user_id=sa_id,
                    titulo="Renovación Procesada",
                    mensaje=f"Se ha aprobado la renovación de la empresa '{solicitud['empresa_nombre']}'.",
                    tipo="RENOVACION",
                    prioridad="BAJA",
                    metadata={"solicitud_id": str(solicitud_id)}
                ))
        
        else:
            # Si es RECHAZADA, notificar a los administradores de la empresa
            admin_ids = self.repo.listar_user_ids_admins_empresa(empresa_id)
            for admin_user_id in admin_ids:
                self.notif_service.crear_notificacion(NotificacionCreate(
                    user_id=admin_user_id,
                    titulo="Solicitud de Renovación Rechazada",
                    mensaje=f"Tu solicitud de renovación ha sido rechazada. Motivo: {data.motivo_rechazo}",
                    tipo="RENOVACION",
                    prioridad="ALTA",
                    metadata={"solicitud_id": str(solicitud_id)}
                ))

            # Notificar Vendedor
            if solicitud['vendedor_id']:
                vendedor_info = self.repo.obtener_vendedor_por_empresa(empresa_id)
                if vendedor_info:
                    self.notif_service.crear_notificacion(NotificacionCreate(
                        user_id=vendedor_info['user_id'],
                        titulo="Renovación Rechazada",
                        mensaje=f"La solicitud de renovación para '{solicitud['empresa_nombre']}' ha sido rechazada. Motivo: {data.motivo_rechazo}",
                        tipo="RENOVACION",
                        prioridad="ALTA",
                        metadata={"solicitud_id": str(solicitud_id)}
                    ))

            # Notificar a Superadmins (Visibilidad para todos)
            superadmin_ids = self.repo.listar_user_ids_superadmins()
            for sa_id in superadmin_ids:
                self.notif_service.crear_notificacion(NotificacionCreate(
                    user_id=sa_id,
                    titulo="Renovación Rechazada",
                    mensaje=f"Se ha rechazado la solicitud de renovación de '{solicitud['empresa_nombre']}'.",
                    tipo="RENOVACION",
                    prioridad="BAJA",
                    metadata={"solicitud_id": str(solicitud_id)}
                ))

        return self.repo.actualizar_estado(solicitud_id, update_data)

    def listar_solicitudes(self, usuario: dict, ver_historial: bool = False) -> List[dict]:
        is_superadmin = usuario.get("role") == "SUPERADMIN" or usuario.get("is_superadmin")
        is_vendedor = usuario.get("role") == "VENDEDOR" or usuario.get("is_vendedor")
        
        estado_filtro = None if ver_historial else "PENDIENTE"

        if is_superadmin:
            return self.repo.listar_solicitudes(estado=estado_filtro)
        
        if is_vendedor:
            # Obtener ID de vendedor
            with self.repo.db.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM sistema_facturacion.vendedores WHERE user_id = %s", (str(usuario['id']),))
                v_row = cur.fetchone()
                if v_row:
                    return self.repo.listar_solicitudes(vendedor_id=v_row['id'], estado=estado_filtro if not ver_historial else None)
        
        # Si es empresa, mostrar sus solicitudes
        if usuario.get("empresa_id"):
            return self.repo.listar_solicitudes(empresa_id=usuario['empresa_id'], estado=estado_filtro if not ver_historial else None)
            
        return []
