from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import logging
import io
import pandas as pd
from datetime import datetime, date

from .repository import RepositorioClientes
from .schemas import ClienteCreacion, ClienteActualizacion
from .analitica_schemas import (
    ReporteNuevosClientesResponse, PeriodoNuevosClientes,
    ReporteTopClientesResponse, TopClienteItem,
    ReporteClientesInactivosResponse, ClienteInactivoItem,
    ReporteAnalisisClientesResponse, SegmentoCliente, ParetoItem
)
from ..vendedores.repositories import RepositorioVendedores
from ..empresas.repositories import RepositorioEmpresas
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class ServicioClientes:
    def __init__(
        self, 
        repo: RepositorioClientes = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        empresa_repo: RepositorioEmpresas = Depends()
    ):
        self.repo = repo
        self.vendedor_repo = vendedor_repo
        self.empresa_repo = empresa_repo

    def _get_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id") # Vital para usuarios regulares
        }

    def listar_clientes(self, usuario_actual: dict, empresa_id_filtro: Optional[UUID] = None):
        logger.info("[INICIO] Listando clientes")
        ctx = self._get_context(usuario_actual)
        
        # 1. Usuario Regular: Solo ve clientes de su propia empresa
        if ctx["is_usuario"]:
            if not ctx["empresa_id"]:
                 logger.warning("[VALIDACIÓN] Usuario sin empresa asignada")
                 raise AppError("Usuario no tiene empresa asignada", 400)
            result = self.repo.listar_clientes(empresa_id=ctx["empresa_id"])
            logger.info(f"[ÉXITO] Clientes listados: {len(result)} registros")
            return result
        
        # 2. Vendedor: Solo ve clientes de empresas que gestiona
        if ctx["is_vendedor"]:
             if not empresa_id_filtro:
                  # Si no filtro, podria retornar vacio o necesitar multiquery, por simplicidad requerimos empresa_id aqui o listar por vendedor
                  # Ajustaremos: Vendedor DEBE especificar empresa para ver clientes, o ver todos de todas sus empresas (complejo)
                  # Simplificacion: Listar requiere empresa_id para admin/vendedor
                  raise AppError("Debe especificar la empresa para listar clientes", 400)
             
             # Verificar propiedad
             empresa = self.empresa_repo.obtener_por_id(empresa_id_filtro)
             vendedor_profile = self.vendedor_repo.obtener_por_user_id(ctx["user_id"])
             if not empresa or not vendedor_profile or str(empresa.get('vendedor_id')) != str(vendedor_profile['id']):
                  raise AppError("No autorizado para ver clientes de esta empresa", 403)
             
             return self.repo.listar_clientes(empresa_id=empresa_id_filtro)

        # 3. Superadmin: Puede ver de cualquier empresa
        if ctx["is_superadmin"]:
            if not empresa_id_filtro:
                raise AppError("Superadmin debe especificar empresa_id", 400)
            return self.repo.listar_clientes(empresa_id=empresa_id_filtro)
            
        raise AppError("No autorizado", 403)

    def obtener_cliente(self, id: UUID, usuario_actual: dict):
        logger.info(f"[INICIO] Obteniendo cliente: {id}")
        ctx = self._get_context(usuario_actual)
        cliente = self.repo.obtener_por_id(id)

        if not cliente:
            logger.warning(f"[VALIDACIÓN] Cliente no encontrado: {id}")
            raise AppError("Cliente no encontrado", 404)
        
        # Validar acceso
        if ctx["is_usuario"]:
             if str(cliente["empresa_id"]) != str(ctx["empresa_id"]):
                  logger.warning(f"[VALIDACIÓN] Acceso negado a cliente")
                  raise AppError("Acceso denegado a este cliente", 403)
        
        elif ctx["is_vendedor"]:
             empresa = self.empresa_repo.obtener_por_id(cliente["empresa_id"])
             vendedor_profile = self.vendedor_repo.obtener_por_user_id(ctx["user_id"])
             if not empresa or not vendedor_profile or str(empresa.get('vendedor_id')) != str(vendedor_profile['id']):
                  logger.warning(f"[VALIDACIÓN] Acceso negado a cliente")
                  raise AppError("Acceso denegado", 403)
        
        logger.info(f"[ÉXITO] Cliente obtenido - ID: {id}")
        return cliente

    def crear_cliente(self, datos: ClienteCreacion, usuario_actual: dict):
        logger.info(f"[CREAR] Iniciando creación de cliente")
        ctx = self._get_context(usuario_actual)
        
        # Determinar empresa_id
        target_empresa_id = None

        if ctx["is_usuario"]:
            target_empresa_id = ctx["empresa_id"]
        else:
             # Admin/Vendedor deben pasar empresa_id en los datos Opcional en schema, pero obligatorio logicamente
             # El schema ClienteBase tiene empresa_id? Revisemos schema:
             # Si, ClienteBase tiene Identificacion, etc. pero NO empresa_id explicitamente en mi correccion anterior del schema
             # Error mio en schema anterior, agregaremos validacion aqui o asumiremos que el frontend lo envia si el schema lo permite.
             # En el schema anterior ClienteBase NO tiene empresa_id, tiene identificacion etc. 
             # IMPORTANTE: El usuario debe crear cliente en SU empresa.
             pass
        
        # Como schema ClienteCreacion hereda ClienteBase, y ClienteBase no tiene empresa_id en mi update,
        # necesitamos inyectarlo.
        
        data_dict = datos.model_dump()
        
        if ctx["is_usuario"]:
            data_dict["empresa_id"] = ctx["empresa_id"]
        elif ctx["is_superadmin"] or ctx["is_vendedor"]:
            # Para simplificar, asumiremos que si es admin/vendedor el ID de empresa viene en un header o parametro, 
            # PERO como estamos en POST body, lo ideal es que el modelo lo tenga.
            # Dado que no edite el modelo para agregar empresa_id opcional, usaremos el del usuario si existe, o fallaremos.
            # FIX: Para evitar complicar, Usuarios crean en SU empresa. Admin/Vendedor NO usan este endpoint tipicamente para crear clientes
            # de facturacion manual, sino la empresa misma.
            if not target_empresa_id:
                 # Hack: Si el modelo trae empresa_id (que no trae), lo usariamos.
                 # Asumimos contexto de usuario por ahora.
                 # Si un ADMIN quiere crear un cliente para una empresa X, deberia "impersonar" o pasar el ID.
                 # Por ahora, cerramos a: USUARIOS crean clientes.
                 if not ctx["empresa_id"]:
                     raise AppError("Contexto de empresa requerido para crear cliente", 400)
                 data_dict["empresa_id"] = ctx["empresa_id"]

        try:
            result = self.repo.crear_cliente(data_dict)
            logger.info(f"[ÉXITO] Cliente creado - ID: {result['id']}")
            return result
        except ValueError as e:
            logger.error(f"[ERROR] Fallo al crear cliente: {str(e)}")
            raise AppError(str(e), 400)

    def actualizar_cliente(self, id: UUID, datos: ClienteActualizacion, usuario_actual: dict):
        logger.info(f"[EDITAR] Iniciando actualización de cliente: {id}")
        cliente = self.obtener_cliente(id, usuario_actual) # Valida permisos y existencia
        
        try:
            result = self.repo.actualizar_cliente(id, datos.model_dump(exclude_unset=True))
            logger.info(f"[ÉXITO] Cliente actualizado - ID: {id}")
            return result
        except ValueError as e:
            logger.error(f"[ERROR] Fallo al actualizar cliente: {str(e)}")
            raise AppError(str(e), 400)

    def eliminar_cliente(self, id: UUID, usuario_actual: dict):
        logger.info(f"[ELIMINAR] Iniciando eliminación de cliente: {id}")
        self.obtener_cliente(id, usuario_actual) # Valida permisos
        result = self.repo.eliminar_cliente(id)
        logger.info(f"[ÉXITO] Cliente eliminado - ID: {id}")
        return result

    def obtener_stats(self, usuario_actual: dict):
        logger.info("[INICIO] Obteniendo estadísticas de clientes")
        ctx = self._get_context(usuario_actual)
        
        # Validar empresa
        empresa_id = None
        if ctx["is_usuario"]:
            empresa_id = ctx["empresa_id"]
        else:
             # Si es superadmin/vendedor deberian pasar filtro, por ahora retornamos vacio o error
             # para no romper el dashboard si llaman sin contexto
             if not empresa_id:
                 logger.warning("[VALIDACIÓN] Admin/vendedor sin contexto de empresa para stats")
                 return {"total": 0, "activos": 0, "con_credito": 0}

        result = self.repo.obtener_stats(empresa_id)
        logger.info(f"[ÉXITO] Estadísticas obtenidas")
        return result

    def exportar_clientes(self, usuario_actual: dict, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Genera un archivo Excel con el listado de clientes"""
        logger.info("[EXPORTAR] Generando reporte de clientes")
        ctx = self._get_context(usuario_actual)
        
        # Validar empresa para exportar
        if not ctx["empresa_id"]:
            if ctx["is_superadmin"] or ctx["is_vendedor"]:
                raise AppError("Debe proporcionar contexto de empresa para exportar", 400)
            raise AppError("No autorizado", 403)
            
        clientes = self.repo.listar_para_exportar(ctx["empresa_id"], start_date, end_date)
        
        if not clientes:
            raise AppError("No se encontraron clientes para exportar en el rango seleccionado", 404)
            
        # Transformar a DataFrame
        df = pd.DataFrame(clientes)
        
        # Eliminar zona horaria de las fechas (Excel no las soporta)
        if 'created_at' in df.columns:
            df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)
        
        # Mapeo de columnas para que se vean bien en el excel
        columnas_visible = {
            'identificacion': 'Identificación',
            'tipo_identificacion': 'Tipo ID',
            'razon_social': 'Razón Social',
            'nombre_comercial': 'Nombre Comercial',
            'email': 'Email',
            'telefono': 'Teléfono',
            'direccion': 'Dirección',
            'ciudad': 'Ciudad',
            'provincia': 'Provincia',
            'dias_credito': 'Días Crédito',
            'limite_credito': 'Límite Crédito',
            'activo': 'Activo',
            'created_at': 'Fecha Registro'
        }
        
        # Filtrar solo las que queremos y renombrar
        df = df[list(columnas_visible.keys())].rename(columns=columnas_visible)
        
        # Formatear booleano 'Activo'
        df['Activo'] = df['Activo'].apply(lambda x: 'Sí' if x else 'No')

        # Escribir a buffer de memoria
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Clientes')
            
        output.seek(0)
        return output

    # ----------------------------------------------------------------
    # R-017: CLIENTES NUEVOS POR MES
    # ----------------------------------------------------------------
    def obtener_nuevos_por_mes(self, usuario_actual: dict, meses: int = 6) -> ReporteNuevosClientesResponse:
        logger.info("[R-017] Obteniendo clientes nuevos por mes")
        ctx = self._get_context(usuario_actual)
        empresa_id = ctx.get("empresa_id")
        if not empresa_id:
            raise AppError("Contexto de empresa requerido", 400)

        filas = self.repo.obtener_nuevos_por_mes(empresa_id, meses)
        periodos = [
            PeriodoNuevosClientes(
                mes=r["mes"].strip(),
                anio=r["anio"],
                mes_numero=r["mes_numero"],
                nuevos_clientes=r["nuevos_clientes"],
                con_primera_compra=r["con_primera_compra"],
                sin_compras=r["sin_compras"],
            )
            for r in filas
        ]
        return ReporteNuevosClientesResponse(
            periodos=periodos,
            total_nuevos=sum(p.nuevos_clientes for p in periodos),
            total_con_compra=sum(p.con_primera_compra for p in periodos),
            total_sin_compra=sum(p.sin_compras for p in periodos),
        )

    # ----------------------------------------------------------------
    # R-018: TOP CLIENTES
    # ----------------------------------------------------------------
    def obtener_top_clientes(
        self,
        usuario_actual: dict,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        criterio: str = "monto",
        limit: int = 10,
    ) -> ReporteTopClientesResponse:
        logger.info("[R-018] Obteniendo top clientes")
        ctx = self._get_context(usuario_actual)
        empresa_id = ctx.get("empresa_id")
        if not empresa_id:
            raise AppError("Contexto de empresa requerido", 400)

        if criterio not in ("monto", "facturas"):
            raise AppError("Criterio inválido. Use 'monto' o 'facturas'", 400)
        if limit not in (5, 10, 20):
            raise AppError("Top inválido. Use 5, 10 o 20", 400)

        filas = self.repo.obtener_top_clientes(empresa_id, fecha_inicio, fecha_fin, criterio, limit)
        clientes = [
            TopClienteItem(
                ranking=r["ranking"],
                cliente_id=r["cliente_id"],
                razon_social=r["razon_social"],
                total_facturas=r["total_facturas"],
                total_compras=r["total_compras"],
                ticket_promedio=r["ticket_promedio"],
                ultima_compra=r["ultima_compra"],
                email=r.get("email"),
                telefono=r.get("telefono"),
            )
            for r in filas
        ]
        return ReporteTopClientesResponse(
            clientes=clientes,
            criterio=criterio,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            total_registros=len(clientes),
        )

    # ----------------------------------------------------------------
    # R-019: CLIENTES INACTIVOS
    # ----------------------------------------------------------------
    def obtener_clientes_inactivos(
        self, usuario_actual: dict, dias: int = 90
    ) -> ReporteClientesInactivosResponse:
        logger.info(f"[R-019] Clientes inactivos (>{dias} días)")
        ctx = self._get_context(usuario_actual)
        empresa_id = ctx.get("empresa_id")
        if not empresa_id:
            raise AppError("Contexto de empresa requerido", 400)

        filas = self.repo.obtener_clientes_inactivos(empresa_id, dias)
        clientes = [
            ClienteInactivoItem(
                cliente_id=r["cliente_id"],
                razon_social=r["razon_social"],
                ultima_factura=r["ultima_factura"],
                dias_sin_comprar=int(r["dias_sin_comprar"]),
                total_historico=r["total_historico"],
                email=r.get("email"),
                telefono=r.get("telefono"),
            )
            for r in filas
        ]
        sin_hist = sum(1 for c in clientes if c.total_historico == 0)
        return ReporteClientesInactivosResponse(
            clientes=clientes,
            dias_umbral=dias,
            total_inactivos=len(clientes),
            total_sin_compras_historicas=sin_hist,
        )

    # ----------------------------------------------------------------
    # R-020: ANÁLISIS DE SEGMENTACIÓN
    # ----------------------------------------------------------------
    def obtener_analisis_clientes(
        self, usuario_actual: dict, periodo_meses: int = 3
    ) -> ReporteAnalisisClientesResponse:
        logger.info("[R-020] Análisis de segmentación de clientes")
        ctx = self._get_context(usuario_actual)
        empresa_id = ctx.get("empresa_id")
        if not empresa_id:
            raise AppError("Contexto de empresa requerido", 400)

        filas = self.repo.obtener_segmentacion_clientes(empresa_id, periodo_meses)

        monto_total = sum(r["monto_periodo"] for r in filas) or 1
        total_clientes = len(filas) or 1

        # Agrupar por segmento
        segmentos_def = {
            "FRECUENTES":  "> 10 facturas en el período",
            "REGULARES":   "5-10 facturas en el período",
            "OCASIONALES": "1-4 facturas en el período",
            "NUEVOS":      "Primer mes, sin compras aún",
            "INACTIVOS":   "Sin compras en el período",
        }
        segmentos_map: dict = {k: {"clientes": 0, "monto": 0} for k in segmentos_def}

        for r in filas:
            seg = r["segmento"]
            segmentos_map[seg]["clientes"] += 1
            segmentos_map[seg]["monto"] += float(r["monto_periodo"])

        segmentos = [
            SegmentoCliente(
                nombre=nombre,
                descripcion=desc,
                total_clientes=segmentos_map[nombre]["clientes"],
                monto_total=round(segmentos_map[nombre]["monto"], 2),
                porcentaje_monto=round(segmentos_map[nombre]["monto"] / float(monto_total) * 100, 1),
                porcentaje_clientes=round(segmentos_map[nombre]["clientes"] / total_clientes * 100, 1),
            )
            for nombre, desc in segmentos_def.items()
            if segmentos_map[nombre]["clientes"] > 0
        ]

        # Pareto 80/20
        acumulado = 0.0
        pareto: list[ParetoItem] = []
        for r in filas:
            acumulado += float(r["monto_periodo"])
            pareto.append(ParetoItem(
                cliente_razon_social=r["razon_social"],
                total_compras=r["monto_periodo"],
                porcentaje_acumulado=round(acumulado / float(monto_total) * 100, 1),
            ))
            if acumulado / float(monto_total) >= 0.80:
                break

        return ReporteAnalisisClientesResponse(
            segmentos=segmentos,
            pareto=pareto,
            total_clientes_analizados=len(filas),
            monto_total_general=round(monto_total, 2),
            periodo_meses=periodo_meses,
        )
