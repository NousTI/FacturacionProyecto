import sys
import os
import uuid
from decimal import Decimal
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connection import get_db_connection
from repositories.gasto_repository import GastoRepository
from repositories.categoria_gasto_repository import CategoriaGastoRepository

def verify_gasto():
    print("Iniciando verificación de Gasto...")
    
    # 1. Setup
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        gasto_repo = GastoRepository(db)
        cat_repo = CategoriaGastoRepository(db)
        
        # Prerequisites: Empresa, Usuario (created automatically or existing), CategoriaGasto
        empresa_id = None
        usuario_id = None
        categoria_id = None
        
        with db.cursor() as cur:
            # Get Empresa
            cur.execute("SELECT id FROM empresa LIMIT 1")
            row = cur.fetchone()
            if row:
                empresa_id = row['id']
            
            # Get Usuario
            cur.execute("SELECT id FROM usuario WHERE empresa_id = %s LIMIT 1", (str(empresa_id),))
            row = cur.fetchone()
            if row:
                usuario_id = row['id']
                
            if not empresa_id or not usuario_id:
                print("FALLO: No se encontraron empresa o usuario para la prueba.")
                return

        # Create a temp category for test
        cat_data = {
            "empresa_id": empresa_id,
            "codigo": f"TEST-G-{uuid.uuid4().hex[:4]}",
            "nombre": "Categoria Prueba Gasto",
            "tipo": "operativo",
            "activo": True
        }
        created_cat = cat_repo.create(cat_data)
        if not created_cat:
            print("FALLO: No se pudo crear categoría para la prueba")
            return
        categoria_id = created_cat['id']
        print(f"Categoría temporal creada: {categoria_id}")

        # 2. Test Create Gasto
        gasto_data = {
            "empresa_id": empresa_id,
            "usuario_id": usuario_id,
            "categoria_gasto_id": categoria_id,
            "fecha_emision": date.today(),
            "concepto": "Compra de insumos prueba",
            "subtotal": Decimal("100.00"),
            "iva": Decimal("12.00"),
            "total": Decimal("112.00"),
            "estado_pago": "pendiente"
        }
        
        print(f"Creando gasto...")
        created_gasto = gasto_repo.create(gasto_data)
        
        if not created_gasto:
            print("FALLO: No se pudo crear el gasto")
            return
            
        print(f"EXITO: Gasto creado con ID: {created_gasto['id']}")
        gasto_id = created_gasto['id']
        
        # 3. Test Read
        print("Leyendo gasto...")
        read_gasto = gasto_repo.get_by_id(gasto_id)
        if not read_gasto or read_gasto['concepto'] != "Compra de insumos prueba":
            print("FALLO: Lectura incorrecta")
        else:
            print("EXITO: Lectura correcta")
            
        # 4. Test Update
        print("Actualizando gasto...")
        update_data = {"concepto": "Gasto Actualizado", "total": Decimal("150.00")}
        updated = gasto_repo.update(gasto_id, update_data)
        if updated and updated['concepto'] == "Gasto Actualizado":
            print("EXITO: Actualización correcta")
        else:
            print("FALLO: Actualización fallida")
            
        # 5. Test List
        print("Listando gastos...")
        lista = gasto_repo.list_by_empresa(empresa_id)
        if any(g['id'] == gasto_id for g in lista):
             print(f"EXITO: Gasto encontrado en lista de {len(lista)}")
        else:
             print("FALLO: Gasto no encontrado en lista")
             
        # 6. Test Delete
        print("Eliminando gasto...")
        if gasto_repo.delete(gasto_id):
            print("EXITO: Gasto eliminado")
        else:
            print("FALLO: No se eliminó el gasto")
            
        # Clean up category
        cat_repo.delete(categoria_id)
        print("Limpieza completada.")

    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass
        except Exception as e:
            print(f"Error closing DB: {e}")

if __name__ == "__main__":
    verify_gasto()
