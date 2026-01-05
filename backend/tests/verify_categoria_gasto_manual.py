import sys
import os
import uuid
from decimal import Decimal

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connection import get_db_connection
from repositories.categoria_gasto_repository import CategoriaGastoRepository

def verify_categoria_gasto():
    print("Iniciando verificación de CategoriaGasto...")
    
    # 1. Setup
    # get_db_connection is a generator. We need to manually handle it.
    db_gen = get_db_connection()
    db = next(db_gen)
    
    try:
        repo = CategoriaGastoRepository(db)
        
        # Mock data
        empresa_id = uuid.uuid4()
        
        with db.cursor() as cur:
            cur.execute("SELECT id FROM empresa LIMIT 1")
            row = cur.fetchone()
            if row:
                empresa_id = row['id']
                print(f"Usando empresa existente: {empresa_id}")
            else:
                print("No se encontró empresa para probar. Abortando.")
                return

        test_code = f"TEST-{uuid.uuid4().hex[:4]}"
        
        # 2. Test Create
        data = {
            "empresa_id": empresa_id,
            "codigo": test_code,
            "nombre": "Gasto de Prueba",
            "descripcion": "Descripcion de prueba",
            "tipo": "operativo",
            "activo": True
        }
        
        print(f"Creando categoría: {data['codigo']}")
        created = repo.create(data)
        
        if not created:
            print("FALLO: No se pudo crear la categoría")
            return
            
        print(f"EXITO: Categoría creada con ID: {created['id']}")
        cat_id = created['id']
        
        # 3. Test Read (Get by ID)
        print("Leyendo categoría por ID...")
        read = repo.get_by_id(cat_id)
        if not read or read['codigo'] != test_code:
            print("FALLO: Lectura incorrecta")
        else:
            print("EXITO: Lectura correcta")
            
        # 4. Test List by Empresa
        print("Listando por empresa...")
        lista = repo.list_by_empresa(empresa_id)
        found = any(c['id'] == cat_id for c in lista)
        if found:
            print(f"EXITO: Categoría encontrada en la lista de {len(lista)} elementos")
        else:
            print("FALLO: Categoría no encontrada en la lista")

        # 5. Test Update
        print("Actualizando categoría...")
        update_data = {"nombre": "Gasto Actualizado"}
        updated = repo.update(cat_id, update_data)
        if updated and updated['nombre'] == "Gasto Actualizado":
            print("EXITO: Actualización correcta")
        else:
            print("FALLO: Actualización fallida")
            
        # 6. Test Delete
        print("Eliminando categoría...")
        deleted = repo.delete(cat_id)
        if deleted:
            print("EXITO: Eliminación correcta")
        else:
            print("FALLO: No se pudo eliminar")
            
        # Verify deletion
        if not repo.get_by_id(cat_id):
            print("EXITO: Confirmado que ya no existe")
        else:
            print("FALLO: Todavía existe después de eliminar")
            
    finally:
        # Clean up connection
        try:
            next(db_gen)
        except StopIteration:
            pass
        except Exception as e:
            print(f"Error closing DB: {e}")

if __name__ == "__main__":
    verify_categoria_gasto()
