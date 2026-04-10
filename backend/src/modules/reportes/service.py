from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import csv
import os
import uuid
from datetime import datetime, timedelta, date

from .repository import RepositorioReportes
from .superadmin.R_031.repository import RepositorioR031
from .superadmin.R_032.repository import RepositorioR032
from .superadmin.R_033.repository import RepositorioR033
from .vendedores.R_031.repository import RepositorioR031Vendedor
from .vendedores.R_032.repository import RepositorioR032Vendedor
from .usuarios.R_026.service import ServicioR026
from .usuarios.R_027.service import ServicioR027
from .usuarios.R_028.service import ServicioR028
from .usuarios.R_008.service import ServicioR008
from .vendedores.dashboard.service import ServicioDashboardVendedor
from .vendedores.RV_001.service import ServicioRV001
from .vendedores.RV_002.service import ServicioRV002
from .vendedores.RV_003.service import ServicioRV003
from .vendedores.RV_004.service import ServicioRV004
from ..empresas.repositories import RepositorioEmpresas
from .schemas import ReporteCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.pdf_generator import render_to_pdf, inyectar_footer_contexto
from ...utils.excel_generator import generate_excel_report

class ServicioReportes:
    def __init__(
        self, 
        repo: RepositorioReportes = Depends(),
        repo_r031: RepositorioR031 = Depends(),
        repo_r032: RepositorioR032 = Depends(),
        repo_r033: RepositorioR033 = Depends(),
        repo_v_r031: RepositorioR031Vendedor = Depends(),
        repo_v_r032: RepositorioR032Vendedor = Depends(),
        svc_r026: ServicioR026 = Depends(),
        svc_r027: ServicioR027 = Depends(),
        svc_r028: ServicioR028 = Depends(),
        svc_r008: ServicioR008 = Depends(),
        svc_dashboard_vendedor: ServicioDashboardVendedor = Depends(),
        svc_rv001: ServicioRV001 = Depends(),
        svc_rv002: ServicioRV002 = Depends(),
        svc_rv003: ServicioRV003 = Depends(),
        svc_rv004: ServicioRV004 = Depends(),
        repo_empresas: RepositorioEmpresas = Depends()
    ):
        self.repo = repo
        self.repo_r031 = repo_r031
        self.repo_r032 = repo_r032
        self.repo_r033 = repo_r033
        self.repo_v_r031 = repo_v_r031
        self.repo_v_r032 = repo_v_r032
        self.svc_r026 = svc_r026
        self.svc_r027 = svc_r027
        self.svc_r028 = svc_r028
        self.svc_r008 = svc_r008
        self.svc_dashboard_vendedor = svc_dashboard_vendedor
        self.svc_rv001 = svc_rv001
        self.svc_rv002 = svc_rv002
        self.svc_rv003 = svc_rv003
        self.svc_rv004 = svc_rv004
        self.repo_empresas = repo_empresas

    def crear_reporte(self, datos: ReporteCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        target_empresa_id = datos.empresa_id or usuario_actual.get('empresa_id')
        target_usuario_id = datos.usuario_id or usuario_actual.get('id')
        
        datos_dict = datos.model_dump()
        datos_dict['usuario_id'] = target_usuario_id

        # Flujo de generación modular para Vendedor (Genera PDF)
        if is_vendedor:
            vendedor_id = usuario_actual.get('internal_vendedor_id')
            vendedor_nombre = f"{usuario_actual.get('nombres', '')} {usuario_actual.get('apellidos', '')}"
            if not vendedor_id: raise AppError("No autorizado como vendedor", 403)
            
            parametros = datos.parametros or {}

            if datos.tipo == 'MIS_EMPRESAS':
                filename = self.svc_rv001.generar_reporte(vendedor_id, vendedor_nombre, parametros)
            elif datos.tipo == 'SUSCRIPCIONES_VENCIDAS':
                filename = self.svc_rv002.generar_reporte(vendedor_id, vendedor_nombre)
            elif datos.tipo == 'SUSCRIPCIONES_PROXIMAS':
                filename = self.svc_rv003.generar_reporte(vendedor_id, vendedor_nombre, parametros)
            elif datos.tipo == 'COMISIONES_MES':
                filename = self.svc_rv004.generar_reporte(vendedor_id, vendedor_nombre, parametros)
            else:
                raise AppError("Tipo de reporte no soportado", 400)
            
            datos_dict['url_descarga'] = f"/static/reportes/{filename}"
            datos_dict['estado'] = 'COMPLETADO'
            datos_dict['empresa_id'] = target_empresa_id
            
            # Devolver objeto en memoria
            datos_dict['id'] = uuid.uuid4()
            datos_dict['created_at'] = datetime.now()
            datos_dict['updated_at'] = datetime.now()
            return datos_dict
        elif is_superadmin:
            parametros = datos.parametros or {}
            fecha_inicio = parametros.get('fecha_inicio')
            fecha_fin = parametros.get('fecha_fin')
            
            if datos.tipo == 'INGRESOS_FINANCIEROS':
                estado = parametros.get('estado')
                ingresos = self.repo.obtener_ingresos_financieros(fecha_inicio, fecha_fin, estado)
                
                context = inyectar_footer_contexto({
                    "data": ingresos,
                    "params": parametros,
                    "now": datetime.now().strftime('%Y-%m-%d %H:%M')
                })
                
                pdf_stream = render_to_pdf("reports/superadmin/ingresos_financieros.html", context)
                filename = f"reporte_ingresos_{uuid.uuid4().hex[:8]}.pdf"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, "wb") as f:
                    f.write(pdf_stream.getbuffer())
                        
                datos_dict['url_descarga'] = f"/static/reportes/{filename}"
                datos_dict['estado'] = 'COMPLETADO'
            
            elif datos.tipo == 'COMISIONES_PAGOS':
                vendedor_id_param = parametros.get('vendedor_id')
                comisiones = self.repo.obtener_comisiones_pagos(vendedor_id_param, fecha_inicio, fecha_fin)
                
                context = inyectar_footer_contexto({
                    "data": comisiones,
                    "params": parametros,
                    "now": datetime.now().strftime('%Y-%m-%d %H:%M')
                })
                
                pdf_stream = render_to_pdf("reports/superadmin/pagos_comisiones.html", context)
                filename = f"reporte_pagos_comisiones_{uuid.uuid4().hex[:8]}.pdf"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, "wb") as f:
                    f.write(pdf_stream.getbuffer())
                        
                datos_dict['url_descarga'] = f"/static/reportes/{filename}"
                datos_dict['estado'] = 'COMPLETADO'
            
            else:
                if not target_empresa_id: raise AppError("Contexto de empresa requerido", 400, "REPORTE_CONTEXT_MISSING")

            if target_empresa_id:
                datos_dict['empresa_id'] = target_empresa_id
                
            datos_dict['id'] = uuid.uuid4()
            datos_dict['created_at'] = datetime.now()
            datos_dict['updated_at'] = datetime.now()
            return datos_dict
        else:
            if not target_empresa_id: raise AppError("Contexto de empresa requerido", 400, "REPORTE_CONTEXT_MISSING")
            datos_dict['empresa_id'] = target_empresa_id
            datos_dict['id'] = uuid.uuid4()
            datos_dict['created_at'] = datetime.now()
            datos_dict['updated_at'] = datetime.now()
            return datos_dict

    def obtener_metricas_vendedor(self, usuario_actual: dict):
        return self.svc_dashboard_vendedor.obtener_metricas(usuario_actual)

    def listar_reportes(self, usuario_actual: dict):
        empresa_id = None if usuario_actual.get(AuthKeys.IS_SUPERADMIN) else usuario_actual.get('empresa_id')
        return self.repo.listar(empresa_id)

    def obtener_reporte(self, id: UUID, usuario_actual: dict):
        reporte = self.repo.obtener_por_id(id)
        if not reporte: raise AppError("Reporte no encontrado", 404, "REPORTE_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(reporte['empresa_id']) != str(usuario_actual.get('empresa_id')):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return reporte

    def eliminar_reporte(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede eliminar reportes", 403, "AUTH_FORBIDDEN")
        return self.repo.eliminar(id)

    def obtener_datos_preview(self, datos: ReporteCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        vendedor_id_actual = usuario_actual.get(AuthKeys.INTERNAL_VENDEDOR_ID)
        
        parametros = datos.parametros or {}
        fecha_inicio = parametros.get('fecha_inicio')
        fecha_fin = parametros.get('fecha_fin')
        
        if datos.tipo == 'INGRESOS_FINANCIEROS' and is_superadmin:
            estado = parametros.get('estado')
            return self.repo.obtener_ingresos_financieros(fecha_inicio, fecha_fin, estado)
            
        elif datos.tipo == 'COMISIONES_PAGOS' and is_superadmin:
            vendedor_id = parametros.get('vendedor_id')
            return self.repo.obtener_comisiones_pagos(vendedor_id, fecha_inicio, fecha_fin)
            
        elif datos.tipo == 'MIS_EMPRESAS' and vendedor_id_actual:
            return self.svc_rv001.repo.obtener_empresas_vendedor_detalle(vendedor_id_actual, fecha_inicio, fecha_fin)
            
        elif datos.tipo == 'SUSCRIPCIONES_VENCIDAS' and vendedor_id_actual:
            return self.svc_rv002.repo.obtener_suscripciones_vencidas(vendedor_id_actual)
            
        elif datos.tipo == 'SUSCRIPCIONES_PROXIMAS' and vendedor_id_actual:
            dias = parametros.get('dias', 15)
            return self.svc_rv003.repo.obtener_suscripciones_proximas(vendedor_id_actual, dias)
            
        elif datos.tipo == 'COMISIONES_MES' and vendedor_id_actual:
            fecha_inicio = parametros.get('fecha_inicio')
            fecha_fin = parametros.get('fecha_fin')
            return self.svc_rv004.repo.obtener_comisiones_mes(vendedor_id_actual, fecha_inicio, fecha_fin)
            

        raise AppError("Tipo de reporte o permisos no válidos para previsualización", 400)

    # =========================================================
    # NUEVOS MÉTODOS DE VENTAS (R-001 a R-005)
    # =========================================================

    def obtener_ventas_general(self, empresa_id: UUID, params: dict):
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        if not fecha_inicio or not fecha_fin:
            raise AppError("Rango de fechas obligatorio", 400)

        # 1. Resumen principal
        resumen = self.repo.obtener_ventas_resumen(
            empresa_id=empresa_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            establecimiento_id=params.get('establecimiento_id'),
            punto_emision_id=params.get('punto_emision_id'),
            usuario_id=params.get('usuario_id'),
            estado=params.get('estado')
        )

        # 2. Comparativa (Periodo anterior)
        # Lógica simplificada: restamos la diferencia de días al inicio
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta = (d2 - d1).days + 1
        
        prev_inicio = (d1 - timedelta(days=delta)).strftime('%Y-%m-%d')
        prev_fin = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')
        
        resumen_prev = self.repo.obtener_ventas_resumen(empresa_id, prev_inicio, prev_fin)
        total_actual = float(resumen['total_general'])
        total_prev = float(resumen_prev['total_general'])

        variacion = 0.0
        if total_prev > 0:
            variacion = ((total_actual - total_prev) / total_prev) * 100
        elif total_actual > 0:
            variacion = 100.0

        resumen['comparacion_anterior_porcentaje'] = round(variacion, 2)

        # Variación de facturas emitidas
        cant_actual = int(resumen['cantidad_facturas'])
        cant_prev = int(resumen_prev['cantidad_facturas'])
        variacion_facturas = 0.0
        if cant_prev > 0:
            variacion_facturas = ((cant_actual - cant_prev) / cant_prev) * 100
        elif cant_actual > 0:
            variacion_facturas = 100.0
        resumen['variacion_facturas'] = round(variacion_facturas, 1)

        # Variación de ticket promedio
        ticket_actual = float(resumen['ticket_promedio'])
        ticket_prev = float(resumen_prev['ticket_promedio'])
        variacion_ticket = 0.0
        if ticket_prev > 0:
            variacion_ticket = ((ticket_actual - ticket_prev) / ticket_prev) * 100
        elif ticket_actual > 0:
            variacion_ticket = 100.0
        resumen['variacion_ticket'] = round(variacion_ticket, 1)

        # 3. Datos para gráficos
        graficos = {
            "por_establecimiento": self.repo.obtener_ventas_por_establecimiento(empresa_id, fecha_inicio, fecha_fin),
            "por_forma_pago": self.repo.obtener_ventas_por_pago(empresa_id, fecha_inicio, fecha_fin)
        }

        # 4. Datos de usuarios
        usuarios = self.repo.obtener_ventas_por_usuario(empresa_id, fecha_inicio, fecha_fin)
        # Renombrar campos para consistencia con template
        for user in usuarios:
            user['cantidad_facturas'] = user.pop('facturas', 0)
            user['facturas_anuladas'] = user.pop('anuladas', 0)

        return {
            "resumen": resumen,
            "graficos": graficos,
            "usuarios": usuarios
        }

    def obtener_ventas_mensuales(self, empresa_id: UUID, anio: int):
        return self.repo.obtener_ventas_periodicas(empresa_id, anio)

    def obtener_ventas_por_usuario(self, empresa_id: UUID, params: dict):
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        if not fecha_inicio or not fecha_fin:
            raise AppError("Rango de fechas obligatorio", 400)
            
        data = self.repo.obtener_ventas_por_usuario(empresa_id, fecha_inicio, fecha_fin)
        # Top 5 ranking
        ranking = data[:5]
        return {
            "detalles": data,
            "ranking": ranking
        }

    def obtener_facturas_anuladas(self, empresa_id: UUID, params: dict):
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        if not fecha_inicio or not fecha_fin:
            raise AppError("Rango de fechas obligatorio", 400)
            
        return self.repo.obtener_facturas_anuladas(
            empresa_id=empresa_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            usuario_id=params.get('usuario_id')
        )

    def obtener_facturas_rechazadas_sri(self, empresa_id: UUID, params: dict):
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        if not fecha_inicio or not fecha_fin:
            raise AppError("Rango de fechas obligatorio", 400)
            
        return self.repo.obtener_facturas_rechazadas_sri(
            empresa_id=empresa_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado=params.get('estado')
        )

    # =========================================================
    # R-031: REPORTE GLOBAL SUPERADMIN
    # =========================================================

    def obtener_reporte_global_superadmin(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        kpis = self.repo_r031.obtener_kpis_globales(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        rescate_raw = self.repo_r031.obtener_zona_rescate(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        upgrade = self.repo_r031.obtener_zona_upgrade(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        planes = self.repo_r031.obtener_planes_mas_vendidos(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        top_vendedores = self.repo_r031.obtener_top_vendedores(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

        now = datetime.now()
        empresas_rescate = []

        for e in rescate_raw:
            # 1. Formatear Último Acceso
            u_acceso = e.get('ultimo_acceso')
            if u_acceso:
                diff_acceso = (now - u_acceso).days
                if diff_acceso > 30:
                    e['ultimo_acceso_fmt'] = u_acceso.strftime('%Y-%m-%d')
                else:
                    e['ultimo_acceso_fmt'] = f"Hace {diff_acceso} días" if diff_acceso > 0 else "Hoy"
            else:
                e['ultimo_acceso_fmt'] = "Nunca"

            # 2. Formatear Deadline
            deadline = e.get('deadline')
            if deadline:
                # Si es datetime, convertir a fecha para comparar
                if isinstance(deadline, datetime):
                    deadline_date = deadline.date()
                else:
                    deadline_date = deadline
                
                diff_deadline = (deadline_date - now.date()).days
                if diff_deadline < 31:
                    if diff_deadline < 0:
                        e['deadline_fmt'] = "Vencido"
                    elif diff_deadline == 0:
                        e['deadline_fmt'] = "Hoy"
                    else:
                        e['deadline_fmt'] = f"{diff_deadline} días"
                else:
                    e['deadline_fmt'] = deadline_date.strftime('%Y-%m-%d')
            
            # 3. Calcular Antigüedad
            f_registro = e.get('fecha_registro')
            if f_registro:
                # Asegurar que f_registro sea date
                if isinstance(f_registro, datetime):
                    f_reg_date = f_registro.date()
                else:
                    f_reg_date = f_registro
                
                diff_ant = now.date() - f_reg_date
                años = diff_ant.days // 365
                meses = (diff_ant.days % 365) // 30
                if años > 0:
                    e['antiguedad'] = f"{años} año{'s' if años > 1 else ''}, {meses} mes{'es' if meses != 1 else ''}"
                elif meses > 0:
                    e['antiguedad'] = f"{meses} mes{'es' if meses > 1 else ''}"
                else:
                    e['antiguedad'] = f"{diff_ant.days} día{'s' if diff_ant.days != 1 else ''}"
            else:
                e['antiguedad'] = "Desconocida"

            empresas_rescate.append(e)

        return {
            **kpis,
            "empresas_rescate": empresas_rescate,
            "empresas_upgrade": upgrade,
            "planes_mas_vendidos": planes,
            "top_vendedores": top_vendedores,
        }

    # =========================================================
    # R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
    # =========================================================

    def obtener_reporte_comisiones_superadmin(self, vendedor_id=None, estado=None, fecha_inicio=None, fecha_fin=None):
        kpis = self.repo_r032.obtener_kpis_comisiones_superadmin(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id, estado=estado)
        detalle = self.repo_r032.obtener_detalle_comisiones_superadmin(vendedor_id, estado, fecha_inicio, fecha_fin)
        top_vendedores = self.repo_r031.obtener_top_vendedores(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id)
        planes = self.repo_r031.obtener_planes_mas_vendidos(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id)
        return {
            "kpis": kpis,
            "detalle": detalle,
            "top_vendedores": top_vendedores,
            "planes_mas_vendidos": planes,
        }

    # =========================================================
    # R-033: USO DEL SISTEMA POR EMPRESA (SUPERADMIN)
    # =========================================================

    def obtener_reporte_uso_sistema_superadmin(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        empresas = self.repo_r033.obtener_uso_sistema_por_empresa(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        modulos = self.repo_r033.obtener_modulos_mas_usados(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        promedio = self.repo_r033.obtener_promedio_usuarios_por_empresa(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        return {
            "empresas": empresas,
            "modulos_mas_usados": modulos,
            **promedio,
        }

    # =========================================================
    # NUEVOS REPORTES FINANCIEROS (R-026 a R-028)
    # =========================================================

    def obtener_pyg_usuario(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """R-026: Estado de Resultados (PyG)."""
        return self.svc_r026.generar_estado_resultados(empresa_id, fecha_inicio, fecha_fin)

    def obtener_iva_ventas_usuario(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """R-027: Reporte de IVA (Ventas)."""
        return self.svc_r027.generar_reporte_iva(empresa_id, fecha_inicio, fecha_fin)

    def obtener_resumen_ejecutivo_usuario(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """R-028: Resumen Ejecutivo (KPIs)."""
        return self.svc_r028.generar_resumen_ejecutivo(empresa_id, fecha_inicio, fecha_fin)

    def obtener_cartera_usuario(self, empresa_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        """R-008: Cuentas por Cobrar con filtro de fechas."""
        return self.svc_r008.generar_reporte_cartera(empresa_id, fecha_inicio, fecha_fin)

    def exportar_reporte(self, empresa_id: UUID, tipo: str, formato: str, params: dict):
        """
        Orquesta la generación de archivos PDF/Excel para los reportes de ventas.
        """
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        if tipo == 'VENTAS_GENERAL':
            data = self.obtener_ventas_general(empresa_id, params)
            if formato == 'pdf':
                context = inyectar_footer_contexto({"data": data, "params": params, "now": now_str})
                return render_to_pdf("reports/ventas_general.html", context)
            else:
                headers = ["Categoría", "Valor"]
                # Aplanar un poco para Excel
                excel_data = [
                    {"Categoría": "Cantidad Facturas", "Valor": data['resumen']['cantidad_facturas']},
                    {"Categoría": "Subtotal Total", "Valor": data['resumen']['subtotal_total']},
                    {"Categoría": "Total IVA", "Valor": data['resumen']['total_iva']},
                    {"Categoría": "Total General", "Valor": data['resumen']['total_general']},
                ]
                return generate_excel_report("Reporte Ventas General", headers, excel_data, ["Categoría", "Valor"])

        elif tipo == 'VENTAS_MENSUALES':
            anio = int(params.get('anio', datetime.now().year))
            data = self.obtener_ventas_mensuales(empresa_id, anio)
            if formato == 'pdf':
                headers = ["Mes", "Facturas", "Subtotal", "IVA", "Total"]
                keys = ["mes", "facturas", "subtotal", "iva", "total"]
                context = {
                    "title": f"Ventas Mensuales - {anio}",
                    "subtitle": f"Empresa ID: {empresa_id}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf("reports/base_tabla.html", context)
            else:
                headers = ["Mes", "Facturas", "Subtotal", "IVA", "Total"]
                return generate_excel_report(f"Ventas Mensuales {anio}", headers, data, ["mes", "facturas", "subtotal", "iva", "total"])

        elif tipo == 'VENTAS_USUARIOS':
            data = self.obtener_ventas_por_usuario(empresa_id, params)['detalles']
            if formato == 'pdf':
                headers = ["Usuario", "Facturas", "Total Ventas", "Ticket Promedio"]
                keys = ["usuario", "facturas", "total_ventas", "ticket_promedio"]
                context = {
                    "title": "Ventas por Usuario",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf("reports/base_tabla.html", context)
            else:
                headers = ["Usuario", "Facturas", "Total Ventas", "Ticket Promedio"]
                return generate_excel_report("Ventas por Usuario", headers, data, ["usuario", "facturas", "total_ventas", "ticket_promedio"])

        elif tipo == 'FACTURAS_ANULADAS':
            data = self.obtener_facturas_anuladas(empresa_id, params)
            if formato == 'pdf':
                headers = ["Número", "Fecha Emisión", "Cliente", "Total", "Motivo"]
                keys = ["numero_factura", "fecha_emision", "cliente", "total", "motivo"]
                context = {
                    "title": "Facturas Anuladas",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf("reports/base_tabla.html", context)
            else:
                headers = ["Número", "Fecha Emisión", "Cliente", "Total", "Usuario Anuló", "Motivo", "Fecha Anulación"]
                keys = ["numero_factura", "fecha_emision", "cliente", "total", "usuario_anulo", "motivo", "fecha_anulacion"]
                return generate_excel_report("Facturas Anuladas", headers, data, keys)

        elif tipo == 'FACTURAS_RECHAZADAS':
            data = self.obtener_facturas_rechazadas_sri(empresa_id, params)
            if formato == 'pdf':
                headers = ["Número", "Cliente", "Fecha Intento", "Estado"]
                keys = ["numero_factura", "cliente", "fecha_intento", "estado_actual"]
                context = {
                    "title": "Facturas Rechazadas por el SRI",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf("reports/base_tabla.html", context)
            else:
                headers = ["Número", "Cliente", "Fecha Intento", "Mensaje SRI", "Estado"]
                keys = ["numero_factura", "cliente", "fecha_intento", "mensaje_sri", "estado_actual"]
                return generate_excel_report("Rechazos SRI", headers, data, keys)

        # --- EXPORTACIÓN DE REPORTES FINANCIEROS (R-026 a R-028, R-008) ---

        elif tipo in ['FINANCIERO_PYG', 'FINANCIERO_IVA', 'FINANCIERO_RESUMEN', 'FINANCIERO_CARTERA']:
            empresa = self.repo_empresas.obtener_por_id(empresa_id)
            fecha_inicio = params.get('fecha_inicio')
            fecha_fin = params.get('fecha_fin')
            
            if tipo == 'FINANCIERO_PYG':
                data = self.obtener_pyg_usuario(empresa_id, fecha_inicio, fecha_fin)
                template = "reports/pyg_report.html"
            elif tipo == 'FINANCIERO_IVA':
                data = self.obtener_iva_ventas_usuario(empresa_id, fecha_inicio, fecha_fin)
                template = "reports/iva_report.html"
            elif tipo == 'FINANCIERO_CARTERA':
                data = self.obtener_cartera_usuario(empresa_id)
                template = "reports/cartera_report.html"
            else: # FINANCIERO_RESUMEN
                data = self.obtener_resumen_ejecutivo_usuario(empresa_id, fecha_inicio, fecha_fin)
                template = "reports/resumen_report.html"
                
            if formato == 'pdf':
                context = {
                    "data": data, 
                    "params": params, 
                    "empresa": empresa, 
                    "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf(template, context)
            else:
                raise AppError("Formato no soportado para reportes financieros", 400)

        # --- EXPORTACIÓN DE REPORTES SUPERADMIN (R-031 a R-033) ---
        
        elif tipo.startswith('SUPERADMIN_'):
            fecha_inicio = params.get('fecha_inicio')
            fecha_fin = params.get('fecha_fin')
            
            if tipo == 'SUPERADMIN_GLOBAL':
                data = self.obtener_reporte_global_superadmin(fecha_inicio, fecha_fin)
                template = "reports/superadmin/global_report.html"
            elif tipo == 'SUPERADMIN_COMISIONES':
                vendedor_id = params.get('vendedor_id')
                estado = params.get('estado')
                data = self.obtener_reporte_comisiones_superadmin(vendedor_id, estado, fecha_inicio, fecha_fin)
                template = "reports/superadmin/comisiones_superadmin.html"
            elif tipo == 'SUPERADMIN_USO':
                data = self.obtener_reporte_uso_sistema_superadmin(fecha_inicio, fecha_fin)
                template = "reports/superadmin/uso_sistema_report.html"
            else:
                raise AppError(f"Tipo de reporte Superadmin desconocido: {tipo}", 400)
                
            if formato == 'pdf':
                context = {
                    "data": data,
                    "params": params,
                    "now": now_str
                }
                inyectar_footer_contexto(context)
                return render_to_pdf(template, context)
            else:
                raise AppError("El dashboard solo admite exportación a PDF con diseño branding", 400)

        raise AppError("Tipo de reporte o formato no soportado para exportación", 400)



    # =========================================================
    # R-031: REPORTE MIS EMPRESAS (VENDEDOR)
    # =========================================================

    def obtener_reporte_vendedor_mis_empresas(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        kpis = self.repo_v_r031.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        empresas = self.repo_v_r031.obtener_detalle_empresas(vendedor_id, fecha_inicio, fecha_fin)

        # Calcular antigüedad para cada empresa
        now = date.today()
        for e in empresas:
            f_reg = e.get('fecha_registro')
            if f_reg:
                if isinstance(f_reg, datetime): f_reg = f_reg.date()
                diff = now - f_reg
                años = diff.days // 365
                meses = (diff.days % 365) // 30
                if años > 0:
                    e['antiguedad'] = f"{años} año{'s' if años > 1 else ''}, {meses} mes{'es' if meses != 1 else ''}"
                elif meses > 0:
                    e['antiguedad'] = f"{meses} mes{'es' if meses > 1 else ''}"
                else:
                    e['antiguedad'] = f"{diff.days} día{'s' if diff.days != 1 else ''}"
            else:
                e['antiguedad'] = "N/A"

        return {
            **kpis,
            "empresas": empresas,
            "grafica_planes": self.repo_v_r031.obtener_grafica_planes(vendedor_id, fecha_inicio, fecha_fin),
            "grafica_ventas_mes": self.repo_v_r031.obtener_grafica_ventas_mes(vendedor_id, fecha_inicio, fecha_fin)
        }

    # =========================================================
    # R-032: REPORTE MIS COMISIONES (VENDEDOR)
    # =========================================================

    def obtener_reporte_vendedor_mis_comisiones(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        kpis = self.repo_v_r032.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        detalle = self.repo_v_r032.obtener_detalle_comisiones(vendedor_id, fecha_inicio, fecha_fin)
        comparativa = self.repo_v_r032.obtener_grafica_comparativa(vendedor_id, fecha_inicio, fecha_fin)

        return {
            **kpis,
            "detalle": detalle,
            "grafica_comparativa": comparativa
        }
