import os
import uuid
from datetime import datetime
from fastapi import Depends
from .repository import RepositorioRV004
from ..R_032.repository import RepositorioR032Vendedor
from .....utils.pdf_generator import render_to_pdf, inyectar_footer_contexto

class ServicioRV004:
    def __init__(self, repo: RepositorioRV004 = Depends(), repo_r032: RepositorioR032Vendedor = Depends()):
        self.repo = repo
        self.repo_r032 = repo_r032

    def generar_reporte(self, vendedor_id: str, vendedor_nombre: str, parametros: dict):
        fecha_inicio = parametros.get('fecha_inicio')
        fecha_fin = parametros.get('fecha_fin')

        # 1. Obtener KPIs, detalle de comisiones y gráfica comparativa
        kpis = self.repo_r032.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        detalle = self.repo_r032.obtener_detalle_comisiones(vendedor_id, fecha_inicio, fecha_fin)
        grafica_comparativa = self.repo_r032.obtener_grafica_comparativa(vendedor_id, fecha_inicio, fecha_fin)

        # 2. Convertir Decimals a float para evitar errores de serialización JSON
        def convert_decimals(obj):
            """Convierte Decimal a float recursivamente"""
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [convert_decimals(item) for item in obj]
            return obj

        kpis = convert_decimals(kpis)
        detalle = convert_decimals(detalle)
        grafica_comparativa = convert_decimals(grafica_comparativa)

        # 3. Preparar contexto
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        context = {
            "data": {
                "kpis": kpis,
                "detalle": detalle,
                "grafica_comparativa": grafica_comparativa
            },
            "vendedor_nombre": vendedor_nombre,
            "now": now_str,
            "params": parametros
        }
        inyectar_footer_contexto(context)

        # 4. Renderizar PDF
        pdf_stream = render_to_pdf("reports/vendedores/comisiones.html", context)
        
        # 5. Guardar archivo
        filename = f"reporte_comisiones_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        return filename
