import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Cargar variables de entorno manualmente
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "sistema_facturacion"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        port=os.getenv("DB_PORT", 5432),
        cursor_factory=RealDictCursor,
        client_encoding="UTF8"
    )

def fix_company_roles():
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # 1. Obtener todos los IDs de permisos disponibles
        cur.execute("SELECT id FROM sistema_facturacion.empresa_permisos")
        permisos = cur.fetchall()
        permiso_ids = [str(p['id']) for p in permisos]
        
        if not permiso_ids:
            print("Error: No se encontraron permisos en el catálogo base.")
            return

        # 2. Obtener todas las empresas
        cur.execute("SELECT id, nombre_comercial FROM sistema_facturacion.empresas")
        empresas = cur.fetchall()
        
        print(f"Procesando {len(empresas)} empresas...")

        for empresa in empresas:
            empresa_id = str(empresa['id'])
            nombre_empresa = empresa['nombre_comercial']
            admin_code = f"ADMIN" # El constraint es (empresa_id, codigo) UNIQUE, no global UNIQUE codigo? 
            # Re-check: la tabla dice "codigo TEXT NOT NULL UNIQUE" Y "COLUMN uq_rol_empresa_codigo UNIQUE (empresa_id, codigo)"
            # Si el campo codigo es UNIQUE per se, entonces debe ser unico en toda la tabla.
            
            # 3. Verificar si ya existe el rol de admin para esta empresa
            cur.execute("""
                SELECT id FROM sistema_facturacion.empresa_roles 
                WHERE empresa_id = %s AND (nombre = 'Administrador de Empresa' OR codigo = %s)
            """, (empresa_id, f"ADMIN_{empresa_id[:8]}"))
            
            rol_existente = cur.fetchone()
            
            if not rol_existente:
                print(f"[+] Creando rol admin para: {nombre_empresa} ({empresa_id})")
                
                # 4. Crear el rol. Usamos un código único basado en el ID de la empresa
                specific_code = f"ADMIN_{empresa_id[:8]}"
                cur.execute("""
                    INSERT INTO sistema_facturacion.empresa_roles (empresa_id, codigo, nombre, descripcion, es_sistema)
                    VALUES (%s, %s, 'Administrador de Empresa', 'Rol con todos los permisos del sistema', TRUE)
                    RETURNING id
                """, (empresa_id, specific_code))
                
                rol_id = str(cur.fetchone()['id'])
                
                # 5. Asignar todos los permisos al nuevo rol
                for p_id in permiso_ids:
                    cur.execute("""
                        INSERT INTO sistema_facturacion.empresa_roles_permisos (rol_id, permiso_id)
                        VALUES (%s, %s)
                        ON CONFLICT (rol_id, permiso_id) DO NOTHING
                    """, (rol_id, p_id))
            else:
                print(f"[.] La empresa '{nombre_empresa}' ya tiene un rol de administrador.")

        conn.commit()
        print("\nProceso completado exitosamente.")

    except Exception as e:
        conn.rollback()
        print(f"Error durante la ejecución: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_company_roles()
