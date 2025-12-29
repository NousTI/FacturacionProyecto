import sys
import os
import asyncio
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), '..')
sys.path.append(backend_path)

print(f"DEBUG: Logic started. CWD: {os.getcwd()}")
print(f"DEBUG: Path: {sys.path}")

try:
    print("DEBUG: Importing DB Connection")
    from database.connection import get_db_connection
    print("DEBUG: Importing SRIService")
    from services.sri_service import SRIService
    print("DEBUG: Importing Repos")
    from repositories.factura_repository import FacturaRepository
    from repositories.cliente_repository import ClienteRepository
    from repositories.empresa_repository import EmpresaRepository
    from repositories.log_emision_repository import LogEmisionRepository
    from repositories.configuracion_sri_repository import ConfiguracionSRIRepository
    from repositories.autorizacion_sri_repository import AutorizacionSRIRepository
    from repositories.punto_emision_repository import PuntoEmisionRepository
    print("DEBUG: Importing Services")
    from services.sri_xml_service import SRIXMLService
    from services.firma_service import FirmaService
    from services.sri_client import SRIClient
    from services.factura_service import FacturaService
    from models.Factura import FacturaCreateInput, FacturaUpdate
    from utils.enums import PermissionCodes, AuthKeys
    from utils.security_utils import SecurityUtils
    print("DEBUG: Imports Done")
except Exception as e:
    print(f"DEBUG: Import Error: {e}")
    sys.exit(1)

# MOCK Dependencies
class MockSRIClient(SRIClient):
    pass # Use original logic which is already simulated

class MockFirmaService(FirmaService):
    def firmar_xml(self, xml_str: str, config: dict) -> str:
        # Override to avoid decrypting garbage password or checking file
        return xml_str.replace("</factura>", self._get_mock_signature() + "\n</factura>")

def setup_test_data(db):
    """
    Setup minimal required data: Empresa, ConfigSRI, Factura.
    We reuse existing if possible or create dummy.
    """
    cursor = db.cursor()
    
    # 1. Get or Create Empresa
    cursor.execute("SELECT * FROM empresa LIMIT 1")
    empresa = cursor.fetchone()
    if not empresa:
        print("No empresa found. Please create one first.")
        return None
    
    empresa_id = empresa['id']
    print(f"Using Empresa: {empresa_id}")

    # 2. Upsert Dummy ConfigSRI
    # 2. Upsert Dummy ConfigSRI
    cursor.execute("SELECT * FROM configuracion_sri WHERE empresa_id = %s", (str(empresa_id),))
    config = cursor.fetchone()
    
    dummy_pass = SecurityUtils.encrypt_text("dummy_pass")
    
    if not config:
        print("Creating Dummy Config SRI...")
        cursor.execute("""
            INSERT INTO configuracion_sri (empresa_id, ambiente, tipo_emision, firma_activa, certificado_digital, clave_certificado, fecha_expiracion_cert)
            VALUES (%s, '1', '1', TRUE, 'dummy_path.p12', %s, NOW() + INTERVAL '1 year')
            RETURNING *
        """, (str(empresa_id), dummy_pass))
        config = cursor.fetchone()
    else:
        print("Updating Config SRI to be Active for test...")
        cursor.execute("""
            UPDATE configuracion_sri 
            SET firma_activa = TRUE, certificado_digital = 'dummy_path.p12', clave_certificado = %s
            WHERE empresa_id = %s
            RETURNING *
        """, (dummy_pass, str(empresa_id)))
        config = cursor.fetchone()
    
    db.commit()

    # 3. Get dependencies for Factura
    cursor.execute("SELECT * FROM cliente WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
    cliente = cursor.fetchone()
    if not cliente:
        print("Need a Cliente")
        return None
        
    cursor.execute("SELECT * FROM usuario LIMIT 1") # Any user
    usuario = cursor.fetchone()
    if not usuario: return None

    cursor.execute("SELECT * FROM establecimiento WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
    estab = cursor.fetchone()
    if not estab: return None
    
    cursor.execute("SELECT * FROM punto_emision WHERE establecimiento_id = %s LIMIT 1", (str(estab['id']),))
    punto = cursor.fetchone()
    if not punto: return None

    # 4. Create a Pending Factura
    print("Creating Test Factura...")
    # Mock user context
    current_user_mock = {
        "id": usuario['id'],
        "empresa_id": empresa_id,
        AuthKeys.IS_SUPERADMIN: True, # Bypass ownership checks for convenience
        "permissions": [PermissionCodes.FACTURA_CREAR, PermissionCodes.FACTURA_ENVIAR_SRI]
    }
    
    factura_repo = FacturaRepository(db)
    punto_repo = PuntoEmisionRepository(db)
    
    # Manually insert simple factura
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
    print(f"Factura Created: {factura_id}")
    
    # Add Detail
    cursor.execute("""
        INSERT INTO factura_detalle (
            factura_id, codigo_producto, descripcion, cantidad, precio_unitario, subtotal, tipo_iva, valor_iva
        ) VALUES (
            %s, 'TEST01', 'Producto Test', 1, 100.00, 100.00, '2', 12.00
        )
    """, (str(factura_id),))
    db.commit()
    
    return factura_id, current_user_mock

def run_test():
    print("--- STARTING SRI FLOW TEST ---")
    
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        setup_res = setup_test_data(db)
        if not setup_res:
            print("Failed to setup data")
            return
    
        factura_id, user_context = setup_res
        
        # Instantiate Service with Mocks
        # We use MockFirmaService to avoid crypto issues with dummy key
        
        service = SRIService(
            factura_repo=FacturaRepository(db),
            cliente_repo=ClienteRepository(db),
            empresa_repo=EmpresaRepository(db),
            log_repo=LogEmisionRepository(db),
            config_repo=ConfiguracionSRIRepository(db),
            autorizacion_repo=AutorizacionSRIRepository(db),
            xml_service=SRIXMLService(),
            firma_service=MockFirmaService(), 
            sri_client=SRIClient() # Uses simulation logic
        )
        
        print(f"\nExtracted Factura ID: {factura_id}")
        print("Sending to SRI...")
        
        try:
            result = service.enviar_factura_sri(factura_id, user_context)
            print("\n--- RESULTADO EXITOSO ---")
            print(result)
            
            # Verify DB Updates
            cursor = db.cursor()
            cursor.execute("SELECT estado FROM factura WHERE id = %s", (str(factura_id),))
            f_state = cursor.fetchone()['estado']
            print(f"\nEstado Factura en DB: {f_state} (Esperado: AUTORIZADO)")
            
            cursor.execute("SELECT * FROM autorizacion_sri WHERE factura_id = %s", (str(factura_id),))
            auth = cursor.fetchone()
            print(f"Registro Autorizacion: {auth['estado'] if auth else 'NO ENCONTRADO'}")
            
        except Exception as e:
            print("\n--- ERROR ---")
            print(e)
            import traceback
            traceback.print_exc()

    finally:
        # Proper teardown of generator
        try:
            next(db_gen)
        except StopIteration:
            pass
        except Exception:
            pass

if __name__ == "__main__":
    run_test()
