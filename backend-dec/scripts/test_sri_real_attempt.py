import sys
import os
from uuid import uuid4

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database.connection import get_db_connection
from services.sri_service import SRIService
from repositories.factura_repository import FacturaRepository
from repositories.cliente_repository import ClienteRepository
from repositories.empresa_repository import EmpresaRepository
from repositories.log_emision_repository import LogEmisionRepository
from repositories.configuracion_sri_repository import ConfiguracionSRIRepository
from repositories.autorizacion_sri_repository import AutorizacionSRIRepository
from repositories.punto_emision_repository import PuntoEmisionRepository
from services.sri_xml_service import SRIXMLService
from services.firma_service import FirmaService
from services.sri_client import SRIClient
from utils.enums import PermissionCodes, AuthKeys
from utils.security_utils import SecurityUtils

def setup_test_data(db):
    cursor = db.cursor()
    
    # 1. Get Empresa
    cursor.execute("SELECT * FROM empresa LIMIT 1")
    empresa = cursor.fetchone()
    if not empresa: return None
    empresa_id = empresa['id']

    # 2. Config SRI (Ensure it exists, even if invalid)
    cursor.execute("SELECT * FROM configuracion_sri WHERE empresa_id = %s", (str(empresa_id),))
    config = cursor.fetchone()
    
    dummy_pass = SecurityUtils.encrypt_text("dummy_pass")
    
    if not config:
        cursor.execute("""
            INSERT INTO configuracion_sri (empresa_id, ambiente, tipo_emision, firma_activa, certificado_digital, clave_certificado, fecha_expiracion_cert)
            VALUES (%s, '1', '1', TRUE, 'invalid_path.p12', %s, NOW() + INTERVAL '1 year')
            RETURNING *
        """, (str(empresa_id), dummy_pass))
    
    db.commit()

    # 3. Get dependencies
    cursor.execute("SELECT * FROM cliente WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
    cliente = cursor.fetchone()
    
    cursor.execute("SELECT * FROM usuario LIMIT 1")
    usuario = cursor.fetchone()

    cursor.execute("SELECT * FROM establecimiento WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
    estab = cursor.fetchone()
    
    cursor.execute("SELECT * FROM punto_emision WHERE establecimiento_id = %s LIMIT 1", (str(estab['id']),))
    punto = cursor.fetchone()
    
    if not all([cliente, usuario, estab, punto]): return None

    # 4. Create Factura
    punto_repo = PuntoEmisionRepository(db)
    seq = punto_repo.increment_secuencial(punto['id'])
    num_fact = f"{estab['codigo']}-{punto['codigo']}-{seq:09d}"
    
    factura_id = uuid4()
    cursor.execute("""
        INSERT INTO factura (
            id, empresa_id, establecimiento_id, punto_emision_id, cliente_id, usuario_id,
            numero_factura, fecha_emision, fecha_vencimiento, 
            subtotal_sin_iva, subtotal_con_iva, iva, total,
            estado, estado_pago, origen, descuento, propina
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, NOW(), NOW(),
            100.00, 0, 12.00, 112.00,
            'BORRADOR', 'PENDIENTE', 'WEB', 0, 0
        ) RETURNING id
    """, (
        str(factura_id), str(empresa_id), str(estab['id']), str(punto['id']), str(cliente['id']), str(usuario['id']),
        num_fact
    ))
    db.commit()
    
    # Detail
    cursor.execute("""
        INSERT INTO factura_detalle (
            factura_id, codigo_producto, descripcion, cantidad, precio_unitario, subtotal, tipo_iva, valor_iva
        ) VALUES (
            %s, 'REAL_TEST', 'Producto Real Test', 1, 100.00, 100.00, '2', 12.00
        )
    """, (str(factura_id),))
    db.commit()
    
    user_context = {
        "id": usuario['id'],
        "empresa_id": empresa_id,
        AuthKeys.IS_SUPERADMIN: True,
        "permissions": [PermissionCodes.FACTURA_CREAR, PermissionCodes.FACTURA_ENVIAR_SRI]
    }
    
    return factura_id, user_context

def run_test():
    print("--- STARTING PRODUCTION REAL ATTEMPT TEST ---")
    
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        res = setup_test_data(db)
        if not res:
            print("Setup Failed")
            return
        
        factura_id, user_context = res
        print(f"Factura ID: {factura_id}")
        
        # REAL SERVICE (No Mocks)
        service = SRIService(
            factura_repo=FacturaRepository(db),
            cliente_repo=ClienteRepository(db),
            empresa_repo=EmpresaRepository(db),
            log_repo=LogEmisionRepository(db),
            config_repo=ConfiguracionSRIRepository(db),
            autorizacion_repo=AutorizacionSRIRepository(db),
            xml_service=SRIXMLService(),
            firma_service=FirmaService(),  # REAL
            sri_client=SRIClient()         # REAL
        )
        
        print("Attempting to send (expecting failure or rejection)...")
        try:
            service.enviar_factura_sri(factura_id, user_context)
            print("WARNING: Unexpected Success (Did SRI accept dummy data?)")
        except Exception as e:
            print(f"Expected Error Caught: {e}")
            
        # Verify Log or Auth Record
        cursor = db.cursor()
        cursor.execute("SELECT * FROM log_emision WHERE factura_id = %s ORDER BY created_at DESC LIMIT 1", (str(factura_id),))
        log = cursor.fetchone()
        
        cursor.execute("SELECT * FROM autorizacion_sri WHERE factura_id = %s", (str(factura_id),))
        auth = cursor.fetchone()
        
        if log:
            print(f"Log Found: Status={log['estado']}, Msg={log['mensaje_error']}")
        else:
            print("No Log Found!")
            
        if auth:
             print(f"Auth Record Found: Status={auth['estado']}, Msg={auth['mensajes']}")
        else:
             print("No Auth Record Found (Expected if it failed before sending or connection error)")

    finally:
        try:
            next(db_gen)
        except:
             pass

if __name__ == "__main__":
    run_test()
