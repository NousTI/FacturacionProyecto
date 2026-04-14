
from decimal import Decimal
import sys
import os

# Set up path to import from src
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

from modules.facturas.schemas import FacturaCreacion, FacturaDetalleCreacion

def test_validation():
    print("Testing Invoice Validation with Discount...")
    
    # 100 units @ 1.00 = 100.00 Gross
    # 10.00 Discount
    # 90.00 Net
    # 15% IVA on 90 = 13.50
    # Expected Total = 90 + 13.5 = 103.50
    
    detalle = FacturaDetalleCreacion(
        producto_id="79e474cb-6524-45e5-a561-bc2fcea1c5cd",
        codigo_producto="TEST-001",
        nombre="Producto Prueba",
        descripcion="Producto de prueba",
        cantidad=100.0,
        precio_unitario=1.00,
        descuento=10.00,
        tipo_iva="4", # 15%
        subtotal=90.00,
        valor_iva=13.50,
        base_imponible=90.00,
        tarifa_iva=15.00
    )
    
    # Payload similar to what Frontend sends
    # subtotal_con_iva = 100 (Gross)
    # descuento = 10
    # iva = 13.5
    # total = 103.5
    
    try:
        factura = FacturaCreacion(
            empresa_id="1ac954c9-2506-413f-bcee-674fafeef2a0",
            establecimiento_id="604f3229-2c4a-4de8-935f-65c7975fdea2",
            punto_emision_id="987e3c05-5cb9-4ee6-afd2-052efe095b3d",
            cliente_id="c29aba04-342c-4d56-8d2f-715592df2fa5",
            usuario_id="c3cc48cf-2acb-49ef-be1c-754ed50d5bd6",
            tipo_documento="01",
            detalles=[detalle],
            subtotal_sin_iva=0,
            subtotal_con_iva=100.00, # Gross
            subtotal_no_objeto_iva=0,
            subtotal_exento_iva=0,
            iva=13.50,
            descuento=10.00,
            total=103.50,
            propina=0,
            retencion_iva=0,
            retencion_renta=0
        )
        print("SUCCESS: Validation passed for 103.50!")
    except Exception as e:
        print(f"FAILED: Validation error: {e}")

if __name__ == "__main__":
    test_validation()
