
import os
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from fastapi import HTTPException

# Configuración de Jinja2
# Se asume que src/templates es la raíz de las plantillas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

def render_to_pdf(template_src: str, context_dict: dict):
    """
    Renderiza una plantilla HTML a un PDF utilizando xhtml2pdf.
    """
    try:
        template = env.get_template(template_src)
        html = template.render(context_dict)
        
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
        
        if not pdf.err:
            return result
        else:
            print(f"Error en pisaDocument: {pdf.err}")
            raise HTTPException(status_code=500, detail="Error al generar el PDF")
            
    except Exception as e:
        print(f"Excepción al generar PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno al generar PDF: {str(e)}")

def crear_ride_factura(factura_data: dict):
    """
    Prepara el contexto y genera el PDF para una factura (RIDE).
    """
    # Aquí puedes añadir lógica adicional para formatear fechas, monedas, etc.
    # Por ahora usamos los datos tal cual vienen
    return render_to_pdf("invoices/ride_classic.html", {"factura": factura_data})
