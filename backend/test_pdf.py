import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'src'))

from utils.pdf_generator import get_barcode_b64, render_to_pdf

try:
    code = "0504202401110294600900120030010000000426319668210"
    b64 = get_barcode_b64(code)
    print(f"B64 Length: {len(b64)}")
    
    context = {"factura": {
        "clave_acceso": code,
        "barcode_svg_b64": b64,
        "snapshot_empresa": {"razon_social": "TEST EMPRESA", "direccion": "TEST DIR"},
        "snapshot_cliente": {"razon_social": "TEST CLI", "identificacion": "123"},
        "detalles": []
    }}
    pdf = render_to_pdf("invoices/ride_classic.html", context)
    print(f"PDF Generated! Bytes: {len(pdf.getvalue())}")
except Exception as e:
    print(f"ERROR: {e}")
