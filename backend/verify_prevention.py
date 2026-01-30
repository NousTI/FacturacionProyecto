
import asyncio
from uuid import UUID
from src.database.session import get_db_connection_raw
from src.modules.suscripciones.services import ServicioSuscripciones
from src.modules.suscripciones.repositories import RepositorioSuscripciones
from src.modules.suscripciones.schemas import PagoSuscripcionQuick
from src.modules.comisiones.service import ServicioComisiones
from src.modules.modulos.service import ServicioModulos
from src.modules.empresas.repositories import RepositorioEmpresas

async def verify_prevention():
    conn = get_db_connection_raw()
    try:
        # Instanciar servicios requeridos
        repo = RepositorioSuscripciones(conn)
        empresa_repo = RepositorioEmpresas(conn)
        comision_service = ServicioComisiones(conn)
        modulo_service = ServicioModulos(conn)
        
        service = ServicioSuscripciones(repo, comision_service, modulo_service, empresa_repo)
        
        # 1. Obtener una suscripción activa
        with conn.cursor() as cur:
            cur.execute("""
                SELECT empresa_id, plan_id 
                FROM sistema_facturacion.suscripciones 
                WHERE estado = 'ACTIVA' 
                LIMIT 1
            """)
            active = cur.fetchone()
            if not active:
                print("No active subscriptions found for test.")
                return
            
            empresa_id = active['empresa_id']
            plan_id = active['plan_id']
            
            cur.execute("SELECT id FROM sistema_facturacion.users LIMIT 1")
            user = cur.fetchone()
            usuario_actual = {"id": user['id'], "role": "SUPERADMIN", "is_superadmin": True}

        print(f"Attempting to re-assign same plan {plan_id} to empresa {empresa_id}...")
        
        data = PagoSuscripcionQuick(
            empresa_id=empresa_id,
            plan_id=plan_id,
            metodo_pago="TEST_VALIDATION"
        )
        
        try:
            await service.registrar_pago_rapido(data, usuario_actual)
            print("FAILED: Backend allowed identical plan change!")
        except Exception as e:
            if "La empresa ya cuenta con el plan" in str(e):
                print(f"SUCCESS: Backend correctly rejected redundant plan! Error: {e}")
            else:
                print(f"UNEXPECTED ERROR: {e}")
                
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(verify_prevention())
