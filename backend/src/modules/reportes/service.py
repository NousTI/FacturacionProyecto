from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import csv
import os
import uuid
from datetime import datetime, timedelta

from .repository import RepositorioReportes
from .schemas import ReporteCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.pdf_generator import render_to_pdf
from ...utils.excel_generator import generate_excel_report

class ServicioReportes:
    def __init__(self, repo: RepositorioReportes = Depends()):
        self.repo = repo

    def crear_reporte(self, datos: ReporteCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        target_empresa_id = datos.empresa_id or usuario_actual.get('empresa_id')
        target_usuario_id = datos.usuario_id or usuario_actual.get('id')
        
        datos_dict = datos.model_dump()
        datos_dict['usuario_id'] = target_usuario_id

        # Flujo de generación esencial para Vendedor
        if is_vendedor:
            vendedor_id = usuario_actual.get('internal_vendedor_id')
            if not vendedor_id: raise AppError("No autorizado como vendedor", 403)
            
            parametros = datos.parametros or {}
            fecha_inicio = parametros.get('fecha_inicio')
            fecha_fin = parametros.get('fecha_fin')

            if datos.tipo == 'MIS_EMPRESAS':
                empresas = self.repo.obtener_empresas_vendedor_detalle(vendedor_id, fecha_inicio, fecha_fin)
                filename = f"reporte_mis_empresas_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['RUC', 'Razon Social', 'Nombre Comercial', 'Email', 'Estado', 'Fecha Registro', 'Usuarios'])
                    for e in empresas:
                        writer.writerow([
                            e.get('ruc', ''), e.get('razon_social', ''), e.get('nombre_comercial', ''),
                            e.get('email', ''), 'ACTIVA' if e.get('activo') else 'INACTIVA', e.get('fecha_registro', ''),
                            e.get('usuarios_registrados', 0)
                        ])

            elif datos.tipo == 'SUSCRIPCIONES_VENCIDAS':
                suscripciones = self.repo.obtener_suscripciones_vencidas(vendedor_id)
                filename = f"reporte_susc_vencidas_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['RUC', 'Razon Social', 'Telefono', 'Email', 'Plan', 'Fecha Vencimiento'])
                    for s in suscripciones:
                        writer.writerow([
                            s.get('ruc', ''), s.get('razon_social', ''), s.get('telefono', ''),
                            s.get('email', ''), s.get('plan_nombre', ''), s.get('fecha_fin', '')
                        ])

            elif datos.tipo == 'SUSCRIPCIONES_PROXIMAS':
                dias = parametros.get('dias', 15)
                suscripciones = self.repo.obtener_suscripciones_proximas(vendedor_id, dias)
                filename = f"reporte_susc_proximas_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['RUC', 'Razon Social', 'Telefono', 'Email', 'Plan', 'Fecha Vencimiento'])
                    for s in suscripciones:
                        writer.writerow([
                            s.get('ruc', ''), s.get('razon_social', ''), s.get('telefono', ''),
                            s.get('email', ''), s.get('plan_nombre', ''), s.get('fecha_fin', '')
                        ])

            elif datos.tipo == 'COMISIONES_MES':
                fecha_inicio = parametros.get('fecha_inicio')
                fecha_fin = parametros.get('fecha_fin')
                comisiones = self.repo.obtener_comisiones_mes(vendedor_id, fecha_inicio, fecha_fin)
                filename = f"reporte_comisiones_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Razon Social', 'Plan', 'Comision (%)', 'Monto Generado', 'Estado', 'Fecha'])
                    for c in comisiones:
                        writer.writerow([
                            c.get('razon_social', ''), c.get('plan_nombre', ''), c.get('porcentaje_aplicado', ''),
                            c.get('monto', ''), c.get('estado', ''), c.get('fecha_generacion', '')
                        ])
            else:
                raise AppError("Tipo de reporte no soportado", 400)
            
            datos_dict['url_descarga'] = f"/static/reportes/{filename}"
            datos_dict['estado'] = 'COMPLETADO'
            datos_dict['empresa_id'] = target_empresa_id
            
            # Devolver objeto en memoria sin guardar en Base de Datos (Segun requerimiento)
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
                filename = f"reporte_ingresos_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Fecha de Pago', 'Empresa/Cliente', 'Concepto', 'Monto Total', 'Estado'])
                    for i in ingresos:
                        writer.writerow([
                            i.get('fecha_pago', ''), i.get('empresa_cliente', ''), i.get('concepto', ''),
                            i.get('monto_total', ''), i.get('estado', '')
                        ])
                        
                datos_dict['url_descarga'] = f"/static/reportes/{filename}"
                datos_dict['estado'] = 'COMPLETADO'
            
            elif datos.tipo == 'COMISIONES_PAGOS':
                vendedor_id_param = parametros.get('vendedor_id')
                comisiones = self.repo.obtener_comisiones_pagos(vendedor_id_param, fecha_inicio, fecha_fin)
                filename = f"reporte_pagos_comisiones_{uuid.uuid4().hex[:8]}.csv"
                filepath = os.path.join("static", "reportes", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, mode='w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Vendedor', 'Periodo', 'Monto de la comision', 'Estado'])
                    for c in comisiones:
                        writer.writerow([
                            c.get('vendedor', ''), c.get('periodo', ''), c.get('monto_comision', ''),
                            c.get('estado', '')
                        ])
                        
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
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
            raise AppError("Solo los vendedores pueden acceder a estas métricas", 403)
        
        vendedor_id = usuario_actual.get('internal_vendedor_id')
        if not vendedor_id:
            raise AppError("Identificador de vendedor no encontrado", 400)
            
        return self.repo.obtener_metricas_vendedor(vendedor_id)

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
        vendedor_id_actual = usuario_actual.get('internal_vendedor_id')
        
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
            return self.repo.obtener_empresas_vendedor_detalle(vendedor_id_actual, fecha_inicio, fecha_fin)
            
        elif datos.tipo == 'SUSCRIPCIONES_VENCIDAS' and vendedor_id_actual:
            return self.repo.obtener_suscripciones_vencidas(vendedor_id_actual)
            
        elif datos.tipo == 'SUSCRIPCIONES_PROXIMAS' and vendedor_id_actual:
            dias = parametros.get('dias', 15)
            return self.repo.obtener_suscripciones_proximas(vendedor_id_actual, dias)
            
        elif datos.tipo == 'COMISIONES_MES' and vendedor_id_actual:
            fecha_inicio = parametros.get('fecha_inicio')
            fecha_fin = parametros.get('fecha_fin')
            return self.repo.obtener_comisiones_mes(vendedor_id_actual, fecha_inicio, fecha_fin)
            

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

        # 3. Datos para gráficos
        graficos = {
            "por_establecimiento": self.repo.obtener_ventas_por_establecimiento(empresa_id, fecha_inicio, fecha_fin),
            "por_forma_pago": self.repo.obtener_ventas_por_pago(empresa_id, fecha_inicio, fecha_fin)
        }

        return {
            "resumen": resumen,
            "graficos": graficos
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
        kpis = self.repo.obtener_kpis_globales(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        rescate = self.repo.obtener_zona_rescate()
        upgrade = self.repo.obtener_zona_upgrade()
        planes = self.repo.obtener_planes_mas_vendidos(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        top_vendedores = self.repo.obtener_top_vendedores(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        return {
            **kpis,
            "empresas_rescate": rescate,
            "empresas_upgrade": upgrade,
            "planes_mas_vendidos": planes,
            "top_vendedores": top_vendedores,
        }

    # =========================================================
    # R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
    # =========================================================

    def obtener_reporte_comisiones_superadmin(self, vendedor_id=None, estado=None, fecha_inicio=None, fecha_fin=None):
        kpis = self.repo.obtener_kpis_comisiones_superadmin()
        detalle = self.repo.obtener_detalle_comisiones_superadmin(vendedor_id, estado, fecha_inicio, fecha_fin)
        top_vendedores = self.repo.obtener_top_vendedores()
        planes = self.repo.obtener_planes_mas_vendidos()
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
        empresas = self.repo.obtener_uso_sistema_por_empresa(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        modulos = self.repo.obtener_modulos_mas_usados(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        promedio = self.repo.obtener_promedio_usuarios_por_empresa()
        return {
            "empresas": empresas,
            "modulos_mas_usados": modulos,
            **promedio,
        }

    def exportar_reporte(self, empresa_id: UUID, tipo: str, formato: str, params: dict):
        """
        Orquesta la generación de archivos PDF/Excel para los reportes de ventas.
        """
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        if tipo == 'VENTAS_GENERAL':
            data = self.obtener_ventas_general(empresa_id, params)
            if formato == 'pdf':
                return render_to_pdf("reports/ventas_general.html", {"data": data, "params": params, "now": now_str})
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
                return render_to_pdf("reports/base_tabla.html", {
                    "title": f"Ventas Mensuales - {anio}",
                    "subtitle": f"Empresa ID: {empresa_id}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                })
            else:
                headers = ["Mes", "Facturas", "Subtotal", "IVA", "Total"]
                return generate_excel_report(f"Ventas Mensuales {anio}", headers, data, ["mes", "facturas", "subtotal", "iva", "total"])

        elif tipo == 'VENTAS_USUARIOS':
            data = self.obtener_ventas_por_usuario(empresa_id, params)['detalles']
            if formato == 'pdf':
                headers = ["Usuario", "Facturas", "Total Ventas", "Ticket Promedio"]
                keys = ["usuario", "facturas", "total_ventas", "ticket_promedio"]
                return render_to_pdf("reports/base_tabla.html", {
                    "title": "Ventas por Usuario",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                })
            else:
                headers = ["Usuario", "Facturas", "Total Ventas", "Ticket Promedio"]
                return generate_excel_report("Ventas por Usuario", headers, data, ["usuario", "facturas", "total_ventas", "ticket_promedio"])

        elif tipo == 'FACTURAS_ANULADAS':
            data = self.obtener_facturas_anuladas(empresa_id, params)
            if formato == 'pdf':
                headers = ["Número", "Fecha Emisión", "Cliente", "Total", "Motivo"]
                keys = ["numero_factura", "fecha_emision", "cliente", "total", "motivo"]
                return render_to_pdf("reports/base_tabla.html", {
                    "title": "Facturas Anuladas",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                })
            else:
                headers = ["Número", "Fecha Emisión", "Cliente", "Total", "Usuario Anuló", "Motivo", "Fecha Anulación"]
                keys = ["numero_factura", "fecha_emision", "cliente", "total", "usuario_anulo", "motivo", "fecha_anulacion"]
                return generate_excel_report("Facturas Anuladas", headers, data, keys)

        elif tipo == 'FACTURAS_RECHAZADAS':
            data = self.obtener_facturas_rechazadas_sri(empresa_id, params)
            if formato == 'pdf':
                headers = ["Número", "Cliente", "Fecha Intento", "Estado"]
                keys = ["numero_factura", "cliente", "fecha_intento", "estado_actual"]
                return render_to_pdf("reports/base_tabla.html", {
                    "title": "Facturas Rechazadas por el SRI",
                    "subtitle": f"Periodo: {params.get('fecha_inicio')} a {params.get('fecha_fin')}",
                    "headers": headers, "keys": keys, "data": data, "now": now_str
                })
            else:
                headers = ["Número", "Cliente", "Fecha Intento", "Mensaje SRI", "Estado"]
                keys = ["numero_factura", "cliente", "fecha_intento", "mensaje_sri", "estado_actual"]
                return generate_excel_report("Rechazos SRI", headers, data, keys)

        raise AppError("Tipo de reporte o formato no soportado para exportación", 400)


