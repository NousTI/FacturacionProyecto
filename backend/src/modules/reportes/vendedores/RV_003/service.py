import os
import uuid
from datetime import datetime
from fastapi import Depends
from .repository import RepositorioRV003
from .....utils.pdf_generator import render_to_pdf, inyectar_footer_contexto

class ServicioRV003:
    def __init__(self, repo: RepositorioRV003 = Depends()):
        self.repo = repo

    def generar_reporte(self, vendedor_id: str, vendedor_nombre: str, parametros: dict):
        dias = parametros.get('dias', 15)
        
        # 1. Obtener datos
        suscripciones = self.repo.obtener_suscripciones_proximas(vendedor_id, dias)
        
        # 2. Preparar contexto
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        context = {
            "data": suscripciones,
            "vendedor_nombre": vendedor_nombre,
            "now": now_str,
            "dias": dias
        }
        inyectar_footer_contexto(context)
        
        # 3. Renderizar PDF
        pdf_stream = render_to_pdf("reports/vendedores/proximas.html", context)
        
        # 4. Guardar archivo
        filename = f"reporte_susc_proximas_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        return filename
