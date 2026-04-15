import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

def update_database_constraints():
    connection_string = "postgresql://postgres:postgres@localhost:5432/postgres"
    
    try:
        conn = psycopg2.connect(connection_string)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- ACTUALIZANDO RESTRICCIONES DE ESTADO_PAGO ---")
        
        # 1. Identificar y eliminar restricciones antiguas
        find_constraint_query = """
            SELECT conname
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE nsp.nspname = 'sistema_facturacion'
              AND rel.relname = 'facturas'
              AND con.contype = 'c'
              AND (
                pg_get_constraintdef(con.oid) LIKE '%estado_pago%'
              );
        """
        cur.execute(find_constraint_query)
        constraints = cur.fetchall()
        
        for c in constraints:
            name = c['conname']
            print(f"Eliminando restricción antigua: {name}")
            cur.execute(f"ALTER TABLE sistema_facturacion.facturas DROP CONSTRAINT {name}")

        # 2. Agregar la nueva restricción
        print("Agregando nueva restricción con estado 'ANULADO'...")
        new_constraint = """
            ALTER TABLE sistema_facturacion.facturas 
            ADD CONSTRAINT chk_facturas_estado_pago 
            CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO', 'ANULADO'))
        """
        cur.execute(new_constraint)
        print("¡Base de Datos actualizada con éxito!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR DB: {str(e)}")
        return False
    return True

def update_sql_file():
    sql_path = r'c:\Users\fredy\Documents\Practicas\FacturacionProyecto\db_sistema_facturacion\sistema_facturacion\facturacion\facturas\facturas.sql'
    if not os.path.exists(sql_path):
        return
    
    # Try different encodings
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            with open(sql_path, 'r', encoding=encoding) as f:
                content = f.read()
            
            old_line = "CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO'))"
            new_line = "CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO', 'ANULADO'))"
            
            if old_line in content:
                new_content = content.replace(old_line, new_line)
                with open(sql_path, 'w', encoding=encoding) as f:
                    f.write(new_content)
                print(f"Archivo SQL actualizado exitosamente usando {encoding}.")
                return
        except UnicodeDecodeError:
            continue
    print("No se pudo actualizar el archivo SQL debido a problemas de codificación.")

if __name__ == "__main__":
    if update_database_constraints():
        update_sql_file()
