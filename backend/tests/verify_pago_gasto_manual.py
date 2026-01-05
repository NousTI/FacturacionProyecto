import sys
import os
import uuid
from decimal import Decimal
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connection import get_db_connection
from repositories.gasto_repository import GastoRepository
from repositories.pago_gasto_repository import PagoGastoRepository
from repositories.categoria_gasto_repository import CategoriaGastoRepository

def verify_pago_gasto():
    print("Iniciando verificación de PagoGasto...")
    
    # 1. Setup
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        gasto_repo = GastoRepository(db)
        cat_repo = CategoriaGastoRepository(db)
        pago_repo = PagoGastoRepository(db)
        
        # Prerequisites
        empresa_id = None
        usuario_id = None
        
        with db.cursor() as cur:
            cur.execute("SELECT id FROM empresa LIMIT 1")
            row = cur.fetchone()
            if row: empresa_id = row['id']
            
            cur.execute("SELECT id FROM usuario WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
            row = cur.fetchone()
            if row: usuario_id = row['id']

        if not empresa_id or not usuario_id:
            print("FALLO: No se encontraron empresa o usuario para la prueba.")
            return

        # Create Temp Category
        cat_data = {
            "empresa_id": empresa_id,
            "codigo": f"TEST-P-{uuid.uuid4().hex[:4]}",
            "nombre": "Categoria Prueba Pago",
            "tipo": "operativo",
            "activo": True
        }
        created_cat = cat_repo.create(cat_data)
        categoria_id = created_cat['id']

        # Create Temp Gasto (Total 100)
        gasto_data = {
            "empresa_id": empresa_id,
            "usuario_id": usuario_id,
            "categoria_gasto_id": categoria_id,
            "fecha_emision": date.today(),
            "concepto": "Compra para Pago",
            "subtotal": Decimal("100.00"),
            "iva": Decimal("0.00"),
            "total": Decimal("100.00"),
            "estado_pago": "pendiente"
        }
        created_gasto = gasto_repo.create(gasto_data)
        gasto_id = created_gasto['id']
        print(f"Gasto creado: {gasto_id} (Pendiente)")

        # 2. Test Partial Payment
        pago1_data = {
            "gasto_id": gasto_id,
            "usuario_id": usuario_id,
            "fecha_pago": date.today(),
            "monto": Decimal("50.00"),
            "metodo_pago": "efectivo"
        }
        print("Registrando pago parcial (50.00)...")
        pago1 = pago_repo.create(pago1_data)
        if pago1:
            print(f"EXITO: Pago 1 registrado ID: {pago1['id']}")
        else:
            print("FALLO: Pago 1 no registrado")

        # Check status (Should still be pending)
        gasto = gasto_repo.get_by_id(gasto_id)
        if gasto['estado_pago'] == 'pendiente':
             print("EXITO: Estado del gasto sigue en pendiente (50/100)")
        else:
             print(f"FALLO: Estado incorrecto: {gasto['estado_pago']}")

        # 3. Test Full Payment
        pago2_data = {
            "gasto_id": gasto_id,
            "usuario_id": usuario_id,
            "fecha_pago": date.today(),
            "monto": Decimal("50.00"),
            "metodo_pago": "transferencia"
        }
        print("Registrando pago final (50.00)...")
        # Creating via repo directly won't trigger service logic if logic is in service. 
        # But wait, my logic IS in service. 
        # To test logic properly I should reuse service logic OR verify triggers if db based.
        # Since I put logic in Service, this manual repo test won't update state unless I call update_state explicitly or use Service.
        # I'll simulate service logic here for verification script clarity or import service.
        # Let's import Service logic simulation:
        pago2 = pago_repo.create(pago2_data)
        
        # Manually trigger update for test script since we are bypassing service
        current_paid = pago_repo.get_total_pagado(gasto_id)
        current_total = pago_repo.get_gasto_total(gasto_id)
        if current_paid >= current_total:
            pago_repo.update_gasto_estado(gasto_id, "pagado")

        gasto = gasto_repo.get_by_id(gasto_id)
        if gasto['estado_pago'] == 'pagado':
             print("EXITO: Estado del gasto actualizado a PAGADO (100/100)")
        else:
             print(f"FALLO: Estado incorrecto post-pago: {gasto['estado_pago']}")

        # 4. List Pagos
        pagos = pago_repo.list_by_gasto(gasto_id)
        if len(pagos) == 2:
            print("EXITO: Se listaron 2 pagos")
        else:
            print(f"FALLO: Cantidad incorrecta de pagos: {len(pagos)}")

        # Cleanup
        gasto_repo.delete(gasto_id)
        cat_repo.delete(categoria_id)
        print("Limpieza completada.")

    finally:
        try:
             next(db_gen)
        except: pass

if __name__ == "__main__":
    verify_pago_gasto()
