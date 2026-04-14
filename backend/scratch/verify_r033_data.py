import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def main():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        print("\n=== PLANES Y LÍMITES ===")
        cur.execute("SELECT id, nombre, max_facturas_mes, max_usuarios, max_establecimientos, max_programaciones FROM sistema_facturacion.planes;")
        planes = cur.fetchall()
        for p in planes:
            print(f"  Plan: {p['nombre']} ({p['id']})")
            print(f"    Facturas: {p['max_facturas_mes']}, Usuarios: {p['max_usuarios']}, Establ: {p['max_establecimientos']}, Prog: {p['max_programaciones']}")

        print("\n=== USO ACTUAL POR EMPRESA (TOP 5) ===")
        # Esta consulta emula la lógica que pusimos en el repositorio R-033
        query = """
            SELECT
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                p.nombre as plan,
                (SELECT COUNT(*) FROM sistema_facturacion.facturas f WHERE f.empresa_id = e.id AND f.estado != 'ANULADA') as facturas,
                p.max_facturas_mes as lim_facturas,
                (SELECT COUNT(*) FROM sistema_facturacion.usuarios u WHERE u.empresa_id = e.id AND u.activo = TRUE) as usuarios,
                p.max_usuarios as lim_usuarios,
                (SELECT COUNT(*) FROM sistema_facturacion.establecimientos est WHERE est.empresa_id = e.id) as establecimientos,
                p.max_establecimientos as lim_establecimientos,
                (SELECT COUNT(*) FROM sistema_facturacion.facturacion_programada fp WHERE fp.empresa_id = e.id AND fp.activo = TRUE) as programaciones,
                p.max_programaciones as lim_programaciones
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id AND s.estado = 'ACTIVA'
            JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            LIMIT 5;
        """
        cur.execute(query)
        usos = cur.fetchall()
        for u in usos:
            print(f"\nEmpresa: {u['empresa']} (Plan: {u['plan']})")
            
            # Detalle de usuarios para depurar
            cur.execute("SELECT id, nombres, apellidos, activo FROM sistema_facturacion.usuarios WHERE empresa_id = (SELECT id FROM sistema_facturacion.empresas WHERE COALESCE(nombre_comercial, razon_social) = %s LIMIT 1)", (u['empresa'],))
            users_det = cur.fetchall()
            print(f"    Usuarios Detectados ({len(users_det)}):")
            for ud in users_det:
                print(f"      - {ud['nombres']} {ud['apellidos']} (Activo: {ud['activo']})")

            pct_f = (u['facturas'] / u['lim_facturas'] * 100) if u['lim_facturas'] > 0 else 0
            pct_u = (u['usuarios'] / u['lim_usuarios'] * 100) if u['lim_usuarios'] > 0 else 0
            pct_e = (u['establecimientos'] / u['lim_establecimientos'] * 100) if u['lim_establecimientos'] > 0 else 0
            pct_p = (u['programaciones'] / u['lim_programaciones'] * 100) if u['lim_programaciones'] > 0 else 0
            
            print(f"  Facturas: {u['facturas']}/{u['lim_facturas']} ({round(pct_f, 1)}%)")
            print(f"  Usuarios: {u['usuarios']}/{u['lim_usuarios']} ({round(pct_u, 1)}%)")
            print(f"  Establ:   {u['establecimientos']}/{u['lim_establecimientos']} ({round(pct_e, 1)}%)")
            print(f"  Prog:     {u['programaciones']}/{u['lim_programaciones']} ({round(pct_p, 1)}%)")
            print(f"  >> PORCENTAJE ESPERADO (MAX): {round(max(pct_f, pct_u, pct_e, pct_p), 1)}%")

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
