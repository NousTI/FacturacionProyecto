import asyncio
import os
import sys
from uuid import UUID
from datetime import datetime

# Setup path
sys.path.append(os.getcwd())

# Mock usuario_actual
usuario_actual = {
    "id": "00000000-0000-0000-0000-000000000000",
    "empresa_id": "00000000-0000-0000-0000-000000000000", # Need real ID
    "username": "testuser",
    "rol": "ADMIN",
    "permisos": ["FACTURAS_CREAR", "FACTURAS_VER_TODAS"],
    "is_superadmin": True
}

async def test_creation():
    from src.modules.facturas.services.service_factura import ServicioFactura
    from src.modules.facturas.schemas import FacturaCreacion
    from src.database.session import get_db
    
    # Needs a real empresa, cliente, establecimiento, punto ids from DB
    try:
        from src.config.env import env
        import psycopg2
        conn = psycopg2.connect(env.database_url)
        cur = conn.cursor()
        
        # Get one of each
        cur.execute("SELECT id FROM sistema_facturacion.empresas LIMIT 1")
        empresa_id = cur.fetchone()[0]
        
        cur.execute(f"SELECT id FROM sistema_facturacion.establecimientos WHERE empresa_id='{empresa_id}' LIMIT 1")
        estab_id = cur.fetchone()[0]
        
        cur.execute(f"SELECT id FROM sistema_facturacion.puntos_emision WHERE establecimiento_id='{estab_id}' LIMIT 1")
        punto_id = cur.fetchone()[0]
        
        cur.execute(f"SELECT id FROM sistema_facturacion.clientes WHERE empresa_id='{empresa_id}' LIMIT 1")
        cliente_id = cur.fetchone()[0]
        
        usuario_actual["empresa_id"] = str(empresa_id)
        
        print(f"Testing with: Empresa={empresa_id}, Estab={estab_id}, Punto={punto_id}, Cliente={cliente_id}")
        
        datos = FacturaCreacion(
            establecimiento_id=estab_id,
            punto_emision_id=punto_id,
            cliente_id=cliente_id,
            empresa_id=empresa_id,
            tipo_documento="01",
            fecha_emision=datetime.now(),
            total=10,
            detalles=[{
                "codigo_producto": "P1",
                "descripcion": "Producto Prueba",
                "cantidad": 1,
                "precio_unitario": 10,
                "tipo_iva": "0"
            }]
        )
        
        # We need a db session
        db_gen = get_db()
        db = next(db_gen)
        
        # Manual DI
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
        
        res = serv.crear_factura(datos, usuario_actual)
        print(f"Success! Factura ID: {res['id']}")
        
    except Exception as e:
        import traceback
        print("FAILURE:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_creation())
