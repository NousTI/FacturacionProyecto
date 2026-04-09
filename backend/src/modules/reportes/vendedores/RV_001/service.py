import os
import uuid
from datetime import datetime
from fastapi import Depends
from .repository import RepositorioRV001
from .....utils.pdf_generator import render_to_pdf, inyectar_footer_contexto

class ServicioRV001:
    def __init__(self, repo: RepositorioRV001 = Depends()):
        self.repo = repo

    def generar_reporte(self, vendedor_id: str, vendedor_nombre: str, parametros: dict):
        fecha_inicio = parametros.get('fecha_inicio')
        fecha_fin = parametros.get('fecha_fin')
        
        # 1. Obtener datos
        empresas = self.repo.obtener_empresas_vendedor_detalle(vendedor_id, fecha_inicio, fecha_fin)
        
        # 2. Preparar contexto para el PDF
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        context = {
            "data": empresas,
            "vendedor_nombre": vendedor_nombre,
            "now": now_str,
            "params": parametros
        }
        inyectar_footer_contexto(context)
        
        # 3. Renderizar PDF
        pdf_stream = render_to_pdf("reports/vendedores/empresas.html", context)
        
        # 4. Guardar archivo físico
        filename = f"reporte_mis_empresas_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        return filename
