import logging
import calendar
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional, Any
from fastapi import Depends

from ..repository_programacion import RepositorioProgramacion
from ..schemas_programacion import (
    FacturacionProgramadaCreacion,
    FacturacionProgramadaActualizacion
)
from ..schemas import FacturaCreacion
from .service_factura import ServicioFactura
from .service_autorizacion import ServicioAutorizacion
from ...usuarios.repositories import RepositorioUsuarios
from ...puntos_emision.repository import RepositorioPuntosEmision
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class ServicioRecurringBilling:
    def __init__(
        self,
        repo_prog: RepositorioProgramacion = Depends(),
        service_factura: ServicioFactura = Depends(),
        service_autorizacion: ServicioAutorizacion = Depends(),
        repo_pe: RepositorioPuntosEmision = Depends(),
        repo_usuarios: RepositorioUsuarios = Depends()
    ):
        self.repo_prog = repo_prog
        self.service_factura = service_factura
        self.service_autorizacion = service_autorizacion
        self.repo_pe = repo_pe
        self.repo_usuarios = repo_usuarios

    def _calcular_proxima_emision(self, frecuencia: str, dia: int, base_date: date) -> date:
        """Calcula la siguiente fecha de emisión según la frecuencia, manejando fin de mes."""
        month = base_date.month
        year = base_date.year
        
        if frecuencia == 'MENSUAL':
            month += 1
        elif frecuencia == 'TRIMESTRAL':
            month += 3
        elif frecuencia == 'ANUAL':
            year += 1
            
        while month > 12:
            month -= 12
            year += 1
            
        # Asegurar que el día sea válido para el mes (ej. 31 de feb -> 28 de feb)
        last_day = calendar.monthrange(year, month)[1]
        actual_day = min(dia, last_day)
        
        return date(year, month, actual_day)

    def crear_programacion(self, datos: FacturacionProgramadaCreacion, usuario_actual: dict) -> dict:
        empresa_id = usuario_actual.get("empresa_id")
        
        # Resolver el ID del perfil de usuario (tabla usuarios) no el de la tabla users (auth)
        auth_user_id = usuario_actual.get("id")
        perfil = self.repo_usuarios.obtener_por_user_id(auth_user_id)
        if not perfil:
            raise AppError("No se encontró el perfil de usuario para facturación", 404)
        usuario_id = perfil['id']
        
        payload = datos.model_dump()
        payload['empresa_id'] = empresa_id
        payload['usuario_id'] = usuario_id
        
        # Fecha de inicio como primera emisión si es hoy o futuro
        if datos.fecha_inicio >= date.today():
            payload['proxima_emision'] = datos.fecha_inicio
        else:
            payload['proxima_emision'] = date.today()

        prog = self.repo_prog.crear(payload)
        if not prog:
            raise AppError("Error al crear la programación", 500)
        return prog

    def crear_programacion_unificada(self, datos: Any, usuario_actual: dict) -> dict:
        """Crea la programación y su factura plantilla en un solo flujo."""
        # 1. Crear la programación básica
        prog = self.crear_programacion(datos.programacion, usuario_actual)
        
        # 2. Inyectar el ID de la programación en la factura plantilla
        datos.factura_plantilla.facturacion_programada_id = prog['id']
        datos.factura_plantilla.origen = "FACTURACION_PROGRAMADA"
        
        # 3. Crear la factura plantilla (BORRADOR)
        self.service_factura.crear_factura(datos.factura_plantilla, usuario_actual)
        
        return prog

    def obtener_programacion(self, id: UUID, usuario_actual: dict) -> dict:
        prog = self.repo_prog.obtener_por_id(id)
        if not prog:
            raise AppError("Programación no encontrada", 404)
        
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            return prog

        if str(prog['empresa_id']) != str(usuario_actual.get("empresa_id")):
            raise AppError("No tiene permiso", 403)
            
        # Validación de "Propias"
        permisos = usuario_actual.get("permisos", [])
        from ....constants.permissions import PermissionCodes
        if PermissionCodes.FACTURA_PROGRAMADA_VER_PROPIAS in permisos and PermissionCodes.FACTURA_PROGRAMADA_VER not in permisos:
             auth_user_id = usuario_actual.get("id")
             perfil = self.repo_usuarios.obtener_por_user_id(auth_user_id)
             if not perfil or str(prog.get('usuario_id')) != str(perfil['id']):
                  raise AppError("No tienes permiso para ver esta programación", 403, "AUTH_FORBIDDEN")

        return prog

    def listar_programaciones(self, usuario_actual: dict, activo: Optional[bool] = None) -> List[dict]:
        empresa_id = usuario_actual.get("empresa_id")
        permisos = usuario_actual.get("permisos", [])
        from ....constants.permissions import PermissionCodes

        perfil_id = None
        # Si tiene VER_PROPIAS y NO tiene VER (todas), filtramos por su ID de perfil
        if PermissionCodes.FACTURA_PROGRAMADA_VER_PROPIAS in permisos and PermissionCodes.FACTURA_PROGRAMADA_VER not in permisos:
            auth_user_id = usuario_actual.get("id")
            perfil = self.repo_usuarios.obtener_por_user_id(auth_user_id)
            if perfil:
                perfil_id = perfil['id']
            else:
                return [] # No tiene perfil de facturación, no ve nada propio
                
        return self.repo_prog.listar(empresa_id=empresa_id, activo=activo, usuario_id=perfil_id)

    def actualizar_programacion(self, id: UUID, datos: FacturacionProgramadaActualizacion, usuario_actual: dict) -> dict:
        self.obtener_programacion(id, usuario_actual)
        res = self.repo_prog.actualizar(id, datos.model_dump(exclude_unset=True))
        if not res:
            raise AppError("Error al actualizar", 500)
        return res

    def eliminar_programacion(self, id: UUID, usuario_actual: dict) -> bool:
        prog = self.obtener_programacion(id, usuario_actual)

        # Bloquear si ya tiene emisiones — preservar integridad histórica
        if prog.get('total_emisiones', 0) > 0:
            raise AppError(
                "No se puede eliminar una programación con historial de emisiones. "
                "Desactívala en su lugar.",
                400, "PROGRAMACION_CON_HISTORIAL"
            )

        # Eliminar la factura plantilla en cascada si existe (solo si está en BORRADOR)
        from ..repository import RepositorioFacturas
        repo_f = RepositorioFacturas(db=self.repo_prog.db)
        plantilla_id = repo_f.obtener_id_plantilla_por_programacion(id)
        if plantilla_id:
            repo_f.eliminar_factura(UUID(plantilla_id))

        return self.repo_prog.eliminar(id)

    def obtener_id_plantilla(self, id: UUID, usuario_actual: dict) -> Optional[str]:
        from ..repository import RepositorioFacturas
        repo_f = RepositorioFacturas(db=self.repo_prog.db)
        return repo_f.obtener_id_plantilla_por_programacion(id)

    def obtener_historial(self, id: UUID, usuario_actual: dict, limit: int = 50, offset: int = 0) -> List[dict]:
        self.obtener_programacion(id, usuario_actual)
        return self.repo_prog.obtener_historial_ejecucion(id, limit=limit, offset=offset)

    def procesar_emisiones_automaticas(self, db_session = None):
        """Busca programaciones vencidas y las emite masivamente con auditoría técnica."""
        pendientes = self.repo_prog.obtener_pendientes_emision()
        if not pendientes:
            return {"procesadas": 0, "exitosas": 0, "fallidas": 0}
            
        logger.info(f"FACTURACION_RECURRENTE: Iniciando proceso para {len(pendientes)} registros.")
        result = {"procesadas": len(pendientes), "exitosas": 0, "fallidas": 0}
        
        for prog in pendientes:
            try:
                res = self._ejecutar_ciclo_emision_unitario(prog)
                if res: result["exitosas"] += 1
                else: result["fallidas"] += 1
            except Exception as e:
                logger.error(f"Error procesando {prog['id']}: {str(e)}")
                result["fallidas"] += 1
                
        return result

    def ejecutar_ahora(self, id: UUID, usuario_actual: dict) -> dict:
        """Ejecuta inmediatamente una regla de facturación (manual)."""
        prog = self.obtener_programacion(id, usuario_actual)
        exitosa = self._ejecutar_ciclo_emision_unitario(prog)
        return {"exitosa": exitosa}

    def _ejecutar_ciclo_emision_unitario(self, prog: dict) -> bool:
        """Lógica central para emitir una factura desde una regla de programación."""
        try:
            # 1. Idempotencia: Verificar si ya se procesó hoy para esta programación
            from ..repository import RepositorioFacturas
            repo_factura = RepositorioFacturas(db=self.repo_prog.db)

            # Buscamos si ya existe una factura (en cualquier estado excepto plantilla)
            # generada HOY para esta programación — evita duplicados en reintentos
            query_idempotencia = """
                SELECT id, estado FROM sistema_facturacion.facturas
                WHERE facturacion_programada_id = %s
                AND origen = 'API'
                AND DATE(fecha_emision) = CURRENT_DATE
                ORDER BY created_at DESC
                LIMIT 1
            """
            factura_hoy = None
            with repo_factura.db.cursor() as cur:
                cur.execute(query_idempotencia, (str(prog['id']),))
                factura_hoy = cur.fetchone()

            if factura_hoy:
                estado_hoy = factura_hoy[1] if isinstance(factura_hoy, (list, tuple)) else factura_hoy.get('estado')
                if estado_hoy in ('AUTORIZADA', 'EN_PROCESO'):
                    logger.info(f"[RECURRENTE] Saltando {prog['id']} - Ya autorizada hoy.")
                    return True # Idempotente
                
                # Existe copia en BORRADOR/ERROR del intento anterior — reutilizarla
                factura_hoy_id = factura_hoy[0] if isinstance(factura_hoy, (list, tuple)) else factura_hoy.get('id')
                logger.info(f"[RECURRENTE] Reutilizando factura {factura_hoy_id} (estado: {estado_hoy}) del intento anterior.")
                usuario_context = {
                    "id": str(prog['usuario_id']),
                    "empresa_id": str(prog['empresa_id']),
                    AuthKeys.IS_SUPERADMIN: True,
                    "permisos": [],
                    "usuario_facturacion_id": str(prog['usuario_id'])
                }
                resultado_sri = self.service_autorizacion.emitir_sri(factura_hoy_id, usuario_context)
                self.registrar_ejecucion(prog['id'], exitosa=True, frecuencia=prog['tipo_frecuencia'], dia=prog['dia_emision'])
                return True

            # 2. Buscar la Factura Plantilla (BORRADOR amarrado a esta programación)
            plantilla_id = repo_factura.obtener_id_plantilla_por_programacion(prog['id'])
            
            if not plantilla_id:
                raise Exception(f"No se encontró una factura plantilla (BORRADOR) para la programación {prog['id']}")

            plantilla = self.service_factura.obtener_detalle_completo(plantilla_id, {"empresa_id": prog['empresa_id'], AuthKeys.IS_SUPERADMIN: True})
            if not plantilla:
                raise Exception(f"Error al cargar detalle de plantilla {plantilla_id}")

            # 2. Preparar Contexto Simulado
            usuario_context = {
                "id": str(prog['usuario_id']),
                "empresa_id": str(prog['empresa_id']),
                AuthKeys.IS_SUPERADMIN: True,
                "permisos": []
            }

            # 3. Preparar Datos de Nueva Factura (Clonando la plantilla)
            detalles_clonados = []
            for det in plantilla.get('detalles', []):
                detalles_clonados.append({
                    "producto_id": det.get('producto_id'),
                    "codigo_producto": det.get('codigo_producto'),
                    "nombre": det.get('nombre'),
                    "descripcion": det.get('descripcion'),
                    "cantidad": det.get('cantidad'),
                    "precio_unitario": det.get('precio_unitario'),
                    "descuento": det.get('descuento'),
                    "tipo_iva": det.get('tipo_iva'),
                    "valor_iva": det.get('valor_iva'),
                    "subtotal": det.get('subtotal')
                })

            datos_factura = FacturaCreacion(
                establecimiento_id=plantilla['establecimiento_id'],
                punto_emision_id=plantilla['punto_emision_id'],
                cliente_id=plantilla['cliente_id'],
                usuario_id=prog['usuario_id'],
                empresa_id=prog['empresa_id'],
                facturacion_programada_id=prog['id'],
                fecha_emision=datetime.now(),
                subtotal_sin_iva=plantilla['subtotal_sin_iva'],
                subtotal_con_iva=plantilla['subtotal_con_iva'],
                subtotal_no_objeto_iva=plantilla['subtotal_no_objeto_iva'],
                subtotal_exento_iva=plantilla['subtotal_exento_iva'],
                iva=plantilla['iva'],
                ice=plantilla.get('ice', 0),
                descuento=plantilla['descuento'],
                propina=plantilla.get('propina', 0),
                total=plantilla['total'],
                detalles=detalles_clonados,
                origen="API",
                observaciones=f"Generada automáticamente desde plantilla. Programación ID: {prog['id']}",
                forma_pago_sri=plantilla.get('forma_pago_sri', '01'),
                plazo=plantilla.get('plazo', 0),
                unidad_tiempo=plantilla.get('unidad_tiempo', 'DIAS')
            )

            # 4. Crear factura (BORRADOR)
            nueva_factura = self.service_factura.crear_factura(datos_factura, usuario_context)

            # 5. Emitir al SRI — asigna secuencial, firma XML y autoriza
            usuario_context_sri = {
                **usuario_context,
                "usuario_facturacion_id": str(prog['usuario_id'])
            }
            resultado_sri = self.service_autorizacion.emitir_sri(nueva_factura['id'], usuario_context_sri)
            
            # 6. Actualizar Programación (Cierre de Ciclo)
            self.registrar_ejecucion(
                prog['id'], 
                exitosa=True, 
                frecuencia=prog['tipo_frecuencia'], 
                dia=prog['dia_emision']
            )
            return True

        except Exception as e:
            logger.error(f"FALLO en ejecución programada {prog['id']}: {str(e)}")
            try:
                query_log_error = """
                    INSERT INTO sistema_facturacion.log_emision_facturas 
                    (facturacion_programada_id, ambiente, estado, tipo_intento, usuario_id, observaciones, mensajes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                with self.repo_prog.db.cursor() as cur:
                    cur.execute(query_log_error, (
                        str(prog['id']), 1, 'ERROR_SISTEMA', 'INICIAL', str(prog['usuario_id']), f"Error: {str(e)}", '[]'
                    ))
            except: pass

            self.registrar_ejecucion(prog['id'], exitosa=False)
            return False

    def registrar_ejecucion(self, id: UUID, exitosa: bool, frecuencia: str = None, dia: int = None):
        """Actualiza estadísticas y proxima fecha tras un intento de emision."""
        prog = self.repo_prog.obtener_por_id(id)
        if not prog: return
        
        updates = {
            "total_emisiones": prog['total_emisiones'] + 1,
            "ultima_emision": date.today()
        }
        
        if exitosa:
            updates["emisiones_exitosas"] = prog['emisiones_exitosas'] + 1
            # Recalcular proxima fecha si se proporcionan los datos
            if frecuencia and dia:
                updates["proxima_emision"] = self._calcular_proxima_emision(frecuencia, dia, date.today())
        else:
            updates["emisiones_fallidas"] = prog['emisiones_fallidas'] + 1
            
        self.repo_prog.actualizar(id, updates)
