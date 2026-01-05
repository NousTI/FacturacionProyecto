import sys
import os
import uuid
from decimal import Decimal
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connection import get_db_connection
from repositories.producto_repository import ProductoRepository
from repositories.movimiento_inventario_repository import MovimientoInventarioRepository

def verify_movimiento():
    print("Iniciando verificación de MovimientoInventario...")
    
    # 1. Setup
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        prod_repo = ProductoRepository(db)
        mov_repo = MovimientoInventarioRepository(db)
        
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

        # Create Temp Product (Stock 100)
        prod_data = {
            "empresa_id": empresa_id,
            "codigo": f"MOV-{uuid.uuid4().hex[:4]}",
            "nombre": "Producto Prueba Movimiento",
            "descripcion": "Desc",
            "precio": Decimal("10.00"),
            "costo": Decimal("5.00"),
            "stock_actual": 100,
            "stock_minimo": 10,
            "tipo_iva": "12%",
            "porcentaje_iva": Decimal("0.12"),
            "maneja_inventario": True,
            "tipo": "bien",
            "unidad_medida": "unidad",
            "activo": True
        }
        created_prod = prod_repo.crear_producto(prod_data)
        producto_id = created_prod['id']
        print(f"Producto creado: {producto_id} (Stock: 100)")

        # 2. Test Entrada (+50)
        # Using repo directly for simplicity, but logic is in service. 
        # I MUST emulate service logic here to verify valid outcome or use service if possible?
        # Creating via repo directly won't update stock unless I manually do it.
        # But this script is to verify DATABASE and REPO logic mostly.
        # Let's verify updating stock manually via the method I added.
        
        mov1_data = {
            "producto_id": producto_id,
            "usuario_id": usuario_id,
            "tipo_movimiento": "entrada",
            "cantidad": 50,
            "empresa_id": empresa_id,
            "stock_anterior": 100,
            "stock_nuevo": 150
        }
        print("Registrando entrada (50)...")
        mov1 = mov_repo.create(mov1_data)
        mov_repo.update_producto_stock(producto_id, 150)
        
        prod = prod_repo.obtener_producto_por_id(producto_id)
        if prod['stock_actual'] == 150:
            print("EXITO: Stock actualizado a 150")
        else:
             print(f"FALLO: Stock incorrecto: {prod['stock_actual']}")

        # 3. Test Salida (-20)
        mov2_data = {
            "producto_id": producto_id,
            "usuario_id": usuario_id,
            "tipo_movimiento": "salida",
            "cantidad": 20,
            "empresa_id": empresa_id,
            "stock_anterior": 150,
            "stock_nuevo": 130
        }
        print("Registrando salida (20)...")
        mov2 = mov_repo.create(mov2_data)
        mov_repo.update_producto_stock(producto_id, 130)

        prod = prod_repo.obtener_producto_por_id(producto_id)
        if prod['stock_actual'] == 130:
            print("EXITO: Stock actualizado a 130")
        else:
             print(f"FALLO: Stock incorrecto: {prod['stock_actual']}")
             
        # Cleanup
        prod_repo.eliminar_producto(producto_id)
        print("Limpieza completada.")

    finally:
        try:
             next(db_gen)
        except: pass

if __name__ == "__main__":
    verify_movimiento()
