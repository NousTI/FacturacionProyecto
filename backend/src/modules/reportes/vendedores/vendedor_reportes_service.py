import os
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Depends

from .R_031.repository import RepositorioR031Vendedor
from .R_032.repository import RepositorioR032Vendedor
from ....utils.pdf_generator import render_to_pdf, inyectar_footer_contexto

class VendedorReportesService:
    def __init__(
        self,
        repo_r031: RepositorioR031Vendedor = Depends(),
        repo_r032: RepositorioR032Vendedor = Depends()
    ):
        self.repo_r031 = repo_r031
        self.repo_r032 = repo_r032

    def generar_reporte_mis_empresas(self, vendedor_id: str, vendedor_nombre: str, params: Dict[str, Any]) -> str:
        """Genera el PDF del reporte R-031: Mis Empresas"""
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        
        # Obtener datos
        kpis = self.repo_r031.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        empresas = self.repo_r031.obtener_detalle_empresas(vendedor_id, fecha_inicio, fecha_fin)
        grafica_planes = self.repo_r031.obtener_grafica_planes(vendedor_id, fecha_inicio, fecha_fin)
        grafica_ventas = self.repo_r031.obtener_grafica_ventas_mes(vendedor_id, fecha_inicio, fecha_fin)

        context = {
            "vendedor_nombre": vendedor_nombre,
            "params": params,
            "now": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "data": {
                "kpis": kpis,
                "empresas": empresas,
                "grafica_planes": grafica_planes,
                "grafica_ventas_mes": grafica_ventas
            }
        }
        
        inyectar_footer_contexto(context)
        
        pdf_stream = render_to_pdf("reports/vendedores/reporte-r031.html", context)
        return self._guardar_pdf(pdf_stream, "mis_empresas")

    def generar_reporte_mis_comisiones(self, vendedor_id: str, vendedor_nombre: str, params: Dict[str, Any]) -> str:
        """Genera el PDF del reporte R-032: Mis Comisiones"""
        fecha_inicio = params.get('fecha_inicio')
        fecha_fin = params.get('fecha_fin')
        
        # Obtener datos del repositorio
        kpis = self.repo_r032.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        detalle = self.repo_r032.obtener_detalle_comisiones(vendedor_id, fecha_inicio, fecha_fin)
        grafica_raw = self.repo_r032.obtener_grafica_comparativa(vendedor_id, fecha_inicio, fecha_fin)

        # Mapeo de datos para la plantilla (específicamente la gráfica)
        grafica_context = {
            "total_actual": grafica_raw.get('total_actual', 0),
            "total_anterior": grafica_raw.get('total_anterior', 0),
            "periodo_actual": "Este Mes",
            "periodo_anterior": "Mes Anterior"
        }

        context = {
            "vendedor_nombre": vendedor_nombre,
            "params": params,
            "now": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "data": {
                "kpis": kpis,
                "detalle": detalle,
                "grafica_comparativa": grafica_context
            }
        }
        
        inyectar_footer_contexto(context)
        
        pdf_stream = render_to_pdf("reports/vendedores/reporte-r032.html", context)
        return self._guardar_pdf(pdf_stream, "mis_comisiones")

    def _guardar_pdf(self, pdf_stream, prefix: str) -> str:
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getbuffer())
            
        return filename
