
import psycopg2
from psycopg2.extras import RealDictCursor

db_url = "postgresql://postgres:postgres@localhost:5432/sistema_facturacion"
conn = psycopg2.connect(db_url)
try:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT us.email, er.id as rol_id
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            LIMIT 1;
        """)
        user = cur.fetchone()
        if user:
            cur.execute("""
                SELECT p.codigo
                FROM sistema_facturacion.empresa_roles_permisos rp
                JOIN sistema_facturacion.empresa_permisos p ON rp.permiso_id = p.id
                WHERE rp.rol_id = %s;
            """, (user['rol_id'],))
            perms = cur.fetchall()
            codes = [p['codigo'] for p in perms]
            print("USER_EMAIL:" + str(user['email']))
            print("PERMISSIONS:" + ",".join(codes))
        else:
            print("NO_USERS")
finally:
    conn.close()
