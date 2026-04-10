import os
import uuid
from datetime import datetime, date
from fastapi import Depends
from .repository import RepositorioRV001
from ..R_031.repository import RepositorioR031Vendedor
from .....utils.pdf_generator import render_to_pdf, inyectar_footer_contexto

class ServicioRV001:
    def __init__(self, repo: RepositorioRV001 = Depends(), repo_r031: RepositorioR031Vendedor = Depends()):
        self.repo = repo
        self.repo_r031 = repo_r031

    def generar_reporte(self, vendedor_id: str, vendedor_nombre: str, parametros: dict):
        fecha_inicio = parametros.get('fecha_inicio')
        fecha_fin = parametros.get('fecha_fin')

        # 1. Obtener KPIs, detalle de empresas y gráficas
        kpis = self.repo_r031.obtener_kpis(vendedor_id, fecha_inicio, fecha_fin)
        empresas = self.repo_r031.obtener_detalle_empresas(vendedor_id, fecha_inicio, fecha_fin)
        grafica_planes = self.repo_r031.obtener_grafica_planes(vendedor_id, fecha_inicio, fecha_fin)
        grafica_ventas_mes = self.repo_r031.obtener_grafica_ventas_mes(vendedor_id, fecha_inicio, fecha_fin)

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
        empresas = convert_decimals(empresas)
        grafica_planes = convert_decimals(grafica_planes)
        grafica_ventas_mes = convert_decimals(grafica_ventas_mes)

        # 3. Calcular antigüedad para cada empresa
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

        # 4. Preparar contexto para el PDF
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        context = {
            "data": {
                "kpis": kpis,
                "empresas": empresas,
                "grafica_planes": grafica_planes,
                "grafica_ventas_mes": grafica_ventas_mes
            },
            "vendedor_nombre": vendedor_nombre,
            "now": now_str,
            "params": parametros
        }
        inyectar_footer_contexto(context)

        # 5. Renderizar PDF
        pdf_stream = render_to_pdf("reports/vendedores/empresas.html", context)

        # 6. Guardar archivo físico
        filename = f"reporte_mis_empresas_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        return filename
