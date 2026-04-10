import sys
import os

# Añadir el path del backend para poder importar src
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.database.session import get_db_connection_raw

def migrate():
    print("Iniciando migración: Añadiendo columna tipo_identificacion...")
    try:
        conn = get_db_connection_raw()
        with conn.cursor() as cur:
            # Verificar si la columna ya existe
            cur.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = 'sistema_facturacion' 
                  AND table_name = 'vendedores' 
                  AND column_name = 'tipo_identificacion'
            """)
            exists = cur.fetchone()['count'] > 0
            
            if not exists:
                cur.execute("ALTER TABLE sistema_facturacion.vendedores ADD COLUMN tipo_identificacion TEXT DEFAULT 'CEDULA'")
                conn.commit()
                print("Columna 'tipo_identificacion' añadida con éxito.")
            else:
                print("La columna 'tipo_identificacion' ya existe.")
                
        conn.close()
    except Exception as e:
        print(f"Error durante la migración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
