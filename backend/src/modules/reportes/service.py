from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import csv
import os
import uuid
from datetime import datetime

from .repository import RepositorioReportes
from .schemas import ReporteCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

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
                comisiones = self.repo.obtener_comisiones_mes(vendedor_id)
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
            return self.repo.obtener_comisiones_mes(vendedor_id_actual)
            
        elif datos.tipo == 'ESTADO_RESULTADOS':
            if not target_empresa_id: raise AppError("ID de empresa requerido", 400)
            if not fecha_inicio or not fecha_fin: raise AppError("Rango de fechas requerido", 400)
            return self.repo.obtener_estado_resultados(target_empresa_id, fecha_inicio, fecha_fin)

        elif datos.tipo == 'IVA_104':
            if not target_empresa_id: raise AppError("ID de empresa requerido", 400)
            mes = parametros.get('mes')
            anio = parametros.get('anio') or datetime.now().year
            if not mes: raise AppError("Mes requerido", 400)
            return self.repo.obtener_reporte_iva(target_empresa_id, int(mes), int(anio))

        raise AppError("Tipo de reporte o permisos no válidos para previsualización", 400)

