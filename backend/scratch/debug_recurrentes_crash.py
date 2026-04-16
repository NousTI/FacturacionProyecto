import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

# Cargar env
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from src.config.env import env

def debug():
    prog_id = "7d95c843-d1b1-4b1e-b129-087106835781"
    conn = psycopg2.connect(
        host=env.DB_HOST,
        database=env.DB_NAME,
        user=env.DB_USER,
        password=env.DB_PASSWORD,
        port=env.DB_PORT,
        cursor_factory=RealDictCursor
    )
    
    try:
        cur = conn.cursor()
        print(f"--- Iniciando diagnóstico para Programación ID: {prog_id} ---\n")
        
        # 1. Obtener datos de la programación
        print("[STEP 1] Buscando datos de la programación...")
        cur.execute("SELECT * FROM sistema_facturacion.facturacion_programada WHERE id = %s", (prog_id,))
        prog = cur.fetchone()
        if not prog:
            print("ERROR: No se encontró la programación.")
            return
        
        empresa_id = prog['empresa_id']
        usuario_id = prog['usuario_id'] # ID en la tabla usuarios
        print(f"  OK: empresa_id={empresa_id}, usuario_id={usuario_id}")
        
        # 2. Paso crítico: Cargar perfil de usuario (lo que hace AuthServices)
        print("\n[STEP 2] Simulando carga de perfil de usuario (Auth flow)...")
        # Primero necesitamos el user_id (de auth) asociado a este perfil de usuario
        cur.execute("SELECT user_id FROM sistema_facturacion.usuarios WHERE id = %s", (str(usuario_id),))
        row_u = cur.fetchone()
        auth_user_id = row_u['user_id'] if row_u else None
        
        if auth_user_id:
            print(f"  Auth User ID: {auth_user_id}")
            # Esta es la consulta que hace RepositorioUsuarios.obtener_por_id
            cur.execute("""
                SELECT us.*, u.id as usuario_id, u.empresa_id, e.activo as empresa_activa
                FROM sistema_facturacion.users us
                LEFT JOIN sistema_facturacion.usuarios u ON us.id = u.user_id
                LEFT JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
                WHERE us.id = %s
            """, (str(auth_user_id),))
            user_auth = cur.fetchone()
            print("  OK: RepositorioUsuarios.obtener_por_id")
        
        # 3. Paso crítico: Resolver bloqueo empresa (La consulta pesada)
        print("\n[STEP 3] Simulando consulta de bloqueo de empresa (_resolver_bloqueo_empresa)...")
        try:
            query_bloqueo = """
                SELECT e.ruc, e.razon_social, v.telefono as vendedor_telefono, e.activo,
                       s.estado as suscripcion_estado, s.fecha_fin,
                       (SELECT u.telefono FROM sistema_facturacion.usuarios u 
                        JOIN sistema_facturacion.users us ON u.user_id = us.id 
                        WHERE us.role = 'SUPERADMIN' AND u.telefono IS NOT NULL LIMIT 1) as admin_telefono
                FROM sistema_facturacion.empresas e
                LEFT JOIN sistema_facturacion.vendedores v ON e.vendedor_id = v.id
                LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                WHERE e.id = %s
            """
            cur.execute(query_bloqueo, (str(empresa_id),))
            e_data = cur.fetchone()
            print("  OK: _resolver_bloqueo_empresa")
        except Exception as e:
            print(f"  !!! FALLO EN _resolver_bloqueo_empresa: {e}")
            conn.rollback()
            cur = conn.cursor() # Reabrir para seguir viendo si hay más
            
        # 4. Paso crítico: Obtener permisos
        print("\n[STEP 4] Simulando carga de permisos...")
        try:
            query_perms = """
                SELECT p.codigo
                FROM sistema_facturacion.usuarios u
                JOIN sistema_facturacion.empresa_roles_permisos erp ON u.empresa_rol_id = erp.rol_id
                JOIN sistema_facturacion.empresa_permisos p ON erp.permiso_id = p.id
                WHERE u.user_id = %s AND erp.activo = TRUE
            """
            if auth_user_id:
                cur.execute(query_perms, (str(auth_user_id),))
                perms = cur.fetchall()
                print(f"  OK: {len(perms)} permisos encontrados.")
        except Exception as e:
            print(f"  !!! FALLO EN OBTENCION DE PERMISOS: {e}")
            conn.rollback()
            cur = conn.cursor()

        # 5. Paso final: El que reportó el 500
        print("\n[STEP 5] Finalizando con el query que falló (obtener_por_id)...")
        cur.execute("SELECT * FROM sistema_facturacion.facturacion_programada WHERE id = %s", (prog_id,))
        final = cur.fetchone()
        print(f"  SITUACION FINAL: {'EXITOSA' if final else 'No se pudo recuperar (transacción abortada si ves este mensaje antes)'}")

    except Exception as e:
        print(f"\n[ERROR FATAL] {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    debug()
