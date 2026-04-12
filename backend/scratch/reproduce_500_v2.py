import asyncio
import os
import sys
from uuid import UUID
from datetime import datetime

# Setup path
sys.path.append(os.getcwd())

async def test_creation():
    from src.config.env import env
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    try:
        conn = psycopg2.connect(env.database_url, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        
        # Get one of each
        cur.execute("SELECT id FROM sistema_facturacion.empresas LIMIT 1")
        emp_row = cur.fetchone()
        if not emp_row:
            print("ERROR: No empresas found in DB")
            return
        empresa_id = emp_row['id']
        
        cur.execute(f"SELECT id FROM sistema_facturacion.establecimientos WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
        est_row = cur.fetchone()
        if not est_row:
             # Try any establecimiento
             cur.execute(f"SELECT id FROM sistema_facturacion.establecimientos LIMIT 1")
             est_row = cur.fetchone()
        
        if not est_row:
            print("ERROR: No establecimientos found in DB")
            return
        estab_id = est_row['id']
        
        cur.execute(f"SELECT id FROM sistema_facturacion.puntos_emision WHERE establecimiento_id = %s LIMIT 1", (str(estab_id),))
        pun_row = cur.fetchone()
        if not pun_row:
             cur.execute(f"SELECT id FROM sistema_facturacion.puntos_emision LIMIT 1")
             pun_row = cur.fetchone()
             
        if not pun_row:
            print("ERROR: No puntos_emision found in DB")
            return
        punto_id = pun_row['id']
        
        cur.execute(f"SELECT id FROM sistema_facturacion.clientes WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
        cli_row = cur.fetchone()
        if not cli_row:
             cur.execute(f"SELECT id FROM sistema_facturacion.clientes LIMIT 1")
             cli_row = cur.fetchone()
             
        if not cli_row:
            print("ERROR: No clientes found in DB")
            return
        cliente_id = cli_row['id']
        
        # Mock usuario_actual with the empresa_id we found
        from src.constants.enums import AuthKeys
        usuario_actual = {
            "id": "00000000-0000-0000-0000-000000000000",
            "empresa_id": str(empresa_id),
            "username": "testuser",
            "rol": "ADMIN",
            "permisos": ["FACTURAS_CREAR", "FACTURAS_VER_TODAS"],
            AuthKeys.IS_SUPERADMIN: True
        }
        
        print(f"Testing with: Empresa={empresa_id}, Estab={estab_id}, Punto={punto_id}, Cliente={cliente_id}")
        
        from src.modules.facturas.schemas import FacturaCreacion
        datos = FacturaCreacion(
            establecimiento_id=estab_id,
            punto_emision_id=punto_id,
            cliente_id=cliente_id,
            empresa_id=empresa_id,
            tipo_documento="01",
            fecha_emision=datetime.now(),
            total=10,
            subtotal_sin_iva=10,
            detalles=[{
                "codigo_producto": "P1",
                "nombre": "Producto Prueba",
                "descripcion": "Producto Prueba Desc",
                "cantidad": 1,
                "precio_unitario": 10,
                "tipo_iva": "0"
            }]
        )
        
        # We need a db session
        from src.database.session import get_db
        db_gen = get_db()
        db = next(db_gen)
        
        # Manual DI
        from src.modules.facturas.services.service_factura import ServicioFactura
        from src.modules.facturas.services.invoice_core import ServicioFacturaCore
        from src.modules.facturas.repository import RepositorioFacturas
        from src.modules.usuarios.repositories import RepositorioUsuarios
        from src.modules.formas_pago.repository import RepositorioFormasPago
        from src.modules.cuentas_cobrar.repository import RepositorioCuentasCobrar
        from src.modules.pagos_factura.repository import RepositorioPagosFactura
        from src.modules.clientes.services import ServicioClientes
        from src.modules.establecimientos.service import ServicioEstablecimientos
        from src.modules.puntos_emision.service import ServicioPuntosEmision
        from src.modules.empresas.services import ServicioEmpresas
        from src.modules.clientes.repository import RepositorioClientes
        from src.modules.establecimientos.repository import RepositorioEstablecimientos
        from src.modules.puntos_emision.repository import RepositorioPuntosEmision
        from src.modules.empresas.repositories import RepositorioEmpresas
        
        repo_fact = RepositorioFacturas(db)
        repo_usu = RepositorioUsuarios(db)
        repo_fp = RepositorioFormasPago(db)
        repo_cc = RepositorioCuentasCobrar(db)
        repo_pag = RepositorioPagosFactura(db)
        
        core = ServicioFacturaCore(
            repo=repo_fact,
            cliente_service=ServicioClientes(RepositorioClientes(db)),
            establecimiento_service=ServicioEstablecimientos(RepositorioEstablecimientos(db)),
            punto_emision_service=ServicioPuntosEmision(RepositorioPuntosEmision(db)),
            punto_emision_repo=RepositorioPuntosEmision(db),
            empresa_service=ServicioEmpresas(RepositorioEmpresas(db))
        )
        
        serv = ServicioFactura(
            core=core,
            usuario_repo=repo_usu,
            formas_pago_repo=repo_fp,
            cuentas_cobrar_repo=repo_cc,
            pagos_repo=repo_pag
        )
        
        print("Executing serv.crear_factura...")
        res = serv.crear_factura(datos, usuario_actual)
        print(f"Success! Factura ID: {res['id']}")
        
    except Exception as e:
        import traceback
        print("\n--- FAILURE TRACEBACK ---")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_creation())
