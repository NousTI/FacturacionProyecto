import os
import uuid
from datetime import datetime
from fastapi import Depends
from .repository import RepositorioRV002
from .....utils.pdf_generator import render_to_pdf

class ServicioRV002:
    def __init__(self, repo: RepositorioRV002 = Depends()):
        self.repo = repo

    def generar_reporte(self, vendedor_id: str, vendedor_nombre: str):
        # 1. Obtener datos
        suscripciones = self.repo.obtener_suscripciones_vencidas(vendedor_id)
        
        # 2. Preparar contexto
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        context = {
            "data": suscripciones,
            "vendedor_nombre": vendedor_nombre,
            "now": now_str
        }
        
        # 3. Renderizar PDF
        pdf_stream = render_to_pdf("reports/vendedores/vencidas.html", context)
        
        # 4. Guardar archivo
        filename = f"reporte_susc_vencidas_{uuid.uuid4().hex[:8]}.pdf"
        filepath = os.path.join("static", "reportes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        return filename
