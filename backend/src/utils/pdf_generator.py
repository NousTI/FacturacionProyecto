import os
import base64
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
from fastapi import HTTPException
from playwright.sync_api import sync_playwright
import barcode
from barcode.writer import SVGWriter

# Configuración de Jinja2
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

def get_barcode_b64(code: str) -> str:
    if not code or code == "-":
        return ""
    try:
        rv = BytesIO()
        # Generar código 128 limpio en formato SVG
        barcode.get_barcode_class('code128')(code, writer=SVGWriter()).write(rv, options={'write_text': False, 'module_width': 0.3})
        # Limpiar y codificar el SVG en B64 para incrustarlo en img
        return base64.b64encode(rv.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error generando barcode: {e}")
        return ""

def render_to_pdf(template_src: str, context_dict: dict):
    """
    Renderiza una plantilla HTML a un PDF utilizando Playwright para máxima precisión visual.
    """
    try:
        template = env.get_template(template_src)
        html = template.render(context_dict)
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            page = browser.new_page()
            
            # Cargar HTML directamente
            page.set_content(html, wait_until="networkidle")
            
            # Generar PDF exacto como se ve en el navegador (incluyendo estilos background)
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "1cm", "bottom": "1cm", "left": "1cm", "right": "1cm"}
            )
            browser.close()
            
        return BytesIO(pdf_bytes)
            
    except Exception as e:
        print(f"Excepción al generar PDF con Playwright: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno al generar PDF: {str(e)}")

def crear_ride_factura(factura_data: dict):
    """
    Prepara el contexto y genera el PDF para una factura (RIDE).
    """
    factura_data["forma_pago_descripcion"] = get_payment_description(factura_data.get("forma_pago_sri", "01"))
    factura_data["tipo_documento_nombre"] = get_document_type_description(factura_data.get("tipo_documento", "01"))
    
    fields_to_check = [
        "numero_autorizacion", "fecha_autorizacion", "guia_remision", 
        "observaciones", "clave_acceso", "plazo", "unidad_tiempo"
    ]
    for field in fields_to_check:
        if not factura_data.get(field):
            factura_data[field] = "-"
    
    empresa = factura_data.get("snapshot_empresa", {})
    tipo = empresa.get("tipo_contribuyente", "").upper()
    leyendas = []
    if "RIMPE" in tipo:
        leyendas.append("CONTRIBUYENTE RÉGIMEN RIMPE")
        if "NEGOCIO POPULAR" in tipo:
            leyendas.append("CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE")
    
    factura_data["leyendas_regimen"] = leyendas

    # Generar el código de barras SVG en B64 para que Playwright lo incruste perfectamente
    factura_data["barcode_svg_b64"] = get_barcode_b64(factura_data.get("clave_acceso", ""))
    
    return render_to_pdf("invoices/ride_classic.html", {"factura": factura_data})
