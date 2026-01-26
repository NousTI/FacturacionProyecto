import sys
import os

# Añadir src al path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from database.session import get_db_connection_raw

def inspect():
    conn = get_db_connection_raw()
    cur = conn.cursor()
    
    # Listar tablas en el esquema sistema_facturacion
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'sistema_facturacion'
    """)
    tables = cur.fetchall()
    print("Tablas en sistema_facturacion:")
    for t in tables:
        print(f"- {t['table_name']}")
        
    # Listar columnas de la tabla users
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'sistema_facturacion'
    """)
    columns = cur.fetchall()
    print("\nColumnas en sistema_facturacion.users:")
    for c in columns:
        print(f"- {c['column_name']} ({c['data_type']})")

    # Listar columnas de la tabla superadmin
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'superadmin' AND table_schema = 'sistema_facturacion'
    """)
    columns = cur.fetchall()
    print("\nColumnas en sistema_facturacion.superadmin:")
    for c in columns:
        print(f"- {c['column_name']} ({c['data_type']})")

    conn.close()

if __name__ == "__main__":
    inspect()
