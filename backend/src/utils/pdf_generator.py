
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

def get_payment_description(code: str) -> str:
    """Retorna la descripción legal de la forma de pago SRI."""
    mapping = {
        "01": "SIN UTILIZACION DEL SISTEMA FINANCIERO",
        "15": "COMPENSACION DE DEUDAS",
        "16": "TARJETA DE DEBITO",
        "17": "DINERO ELECTRONICO",
        "18": "TARJETA PREPAGO",
        "19": "TARJETA DE CREDITO",
        "20": "OTROS CON UTILIZACION DEL SISTEMA FINANCIERO",
        "21": "ENDOSO DE TITULOS"
    }
    return mapping.get(code, "-")

def get_document_type_description(code: str) -> str:
    """Retorna el nombre del documento según el código SRI."""
    mapping = {
        "01": "FACTURA",
        "04": "NOTA DE CRÉDITO",
        "05": "NOTA DE DÉBITO",
    }
    return mapping.get(code, "COMPROBANTE")

def render_to_pdf(template_src: str, context_dict: dict):
    """
    Renderiza una plantilla HTML a un PDF utilizando xhtml2pdf.
    """
    try:
        template = env.get_template(template_src)
        html = template.render(context_dict)
        
        result = BytesIO()
        # Registrar fuentes si fuera necesario (opcional)
        # pisa.pisaDocument(..., path=...)
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
    # Enriquecer contexto con descripciones legales
    factura_data["forma_pago_descripcion"] = get_payment_description(factura_data.get("forma_pago_sri", "01"))
    factura_data["tipo_documento_nombre"] = get_document_type_description(factura_data.get("tipo_documento", "01"))
    
    # Manejar campos faltantes con '-' para evitar hardcodeo
    fields_to_check = [
        "numero_autorizacion", "fecha_autorizacion", "guia_remision", 
        "observaciones", "clave_acceso", "plazo", "unidad_tiempo"
    ]
    for field in fields_to_check:
        if not factura_data.get(field):
            factura_data[field] = "-"
    
    # Manejar leyendas de régimen según el SQL 'tipo_contribuyente'
    empresa = factura_data.get("snapshot_empresa", {})
    tipo = empresa.get("tipo_contribuyente", "").upper()
    leyendas = []
    if "RIMPE" in tipo:
        leyendas.append("CONTRIBUYENTE RÉGIMEN RIMPE")
        if "NEGOCIO POPULAR" in tipo:
            leyendas.append("CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE")
    
    # Agente de retencion (si el SQL lo soportara en el futuro)
    # Por ahora manual si viene en el snapshot o se detecta
    
    factura_data["leyendas_regimen"] = leyendas
    
    return render_to_pdf("invoices/ride_classic.html", {"factura": factura_data})
