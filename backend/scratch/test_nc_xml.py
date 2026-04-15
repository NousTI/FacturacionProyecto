import sys
import os
from uuid import uuid4
from datetime import datetime

# Añadir el path del backend para poder importar
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from modules.sri.xml_nota_credito_service import ServicioSRIXMLNotaCredito

def test_xml_generation():
    service = ServicioSRIXMLNotaCredito()
    
    nc = {
        "id": uuid4(),
        "establecimiento": "001",
        "punto_emision": "100",
        "secuencial": "000000001",
        "fecha_emision": datetime.now(),
        "fecha_emision_docs_modificado": datetime.now(),
        "cod_doc_modificado": "01",
        "num_doc_modificado": "001-100-000000500",
        "motivo_anulacion": "ERROR EN DIGITACION",
        "subtotal_15_iva": 100.00,
        "subtotal_0_iva": 0.00,
        "iva_total": 15.00,
        "valor_total_anulado": 115.00
    }
    
    cliente = {
        "razon_social": "CLIENTE PRUEBA",
        "identificacion": "1712345678001",
        "tipo_identificacion": "RUC",
        "email": "test@example.com"
    }
    
    empresa = {
        "razon_social": "EMPRESA DE PRUEBA S.A.",
        "ruc": "1790011001001",
        "direccion": "AV. AMAZONAS",
        "obligado_contabilidad": True
    }
    
    detalles = [
        {
            "codigo_producto": "P001",
            "nombre": "PRODUCTO DE PRUEBA",
            "cantidad": 1,
            "precio_unitario": 100.00,
            "descuento": 0,
            "subtotal": 100.00,
            "valor_iva": 15.00
        }
    ]
    
    print("--- Generando XML de Nota de Crédito ---")
    xml_str = service.generar_xml_nota_credito(nc, cliente, empresa, detalles)
    print(xml_str)
    
    if '<notaCredito' in xml_str and '<infoNotaCredito>' in xml_str:
        print("\n[OK] El XML parece tener la estructura base correcta.")
        if '<codDocModificado>01</codDocModificado>' in xml_str:
            print("[OK] Campo codDocModificado presente.")
    else:
        print("\n[ERROR] Estructura de XML inválida.")

if __name__ == "__main__":
    test_xml_generation()
