"""
Diagnóstico: Tooltip Zona Rescate (Antigüedad y Representante)
Ejecutar: python scratch/debug_tooltip.py
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config.env import env

DB_KWARGS = dict(host=env.DB_HOST, database=env.DB_NAME,
                 user=env.DB_USER, password=env.DB_PASSWORD, port=env.DB_PORT)

conn = psycopg2.connect(**DB_KWARGS, cursor_factory=RealDictCursor)
cur = conn.cursor()

def run(label, sql, params=()):
    print(f"\n{'='*60}\n  {label}\n{'='*60}")
    cur.execute(sql, params)
    rows = cur.fetchall()
    if rows:
        for i, row in enumerate(rows): print(f"  [{i+1}]", dict(row))
    else:
        print("  (Sin resultados)")

# Empresa en rescate
EMPRESA_ID = '668e9f7e-3af1-4f19-bdaf-5c7ca147c87f'

# 1. datos base de la empresa (created_at = antigüedad)
run("EMPRESA - created_at (fuente de antigüedad)", """
    SELECT id, nombre_comercial, razon_social, activo, created_at, 
           NOW()::date - created_at::date as dias_antiguedad
    FROM sistema_facturacion.empresas
    WHERE id = %s
""", (EMPRESA_ID,))

# 2. Usuarios de esa empresa
run("USUARIOS de la empresa", """
    SELECT u.id, u.nombres, u.apellidos, u.empresa_rol_id, u.created_at
    FROM sistema_facturacion.usuarios u
    WHERE u.empresa_id = %s
    ORDER BY u.created_at ASC
""", (EMPRESA_ID,))

# 3. Roles disponibles en empresa_roles
run("EMPRESA_ROLES - estructura de códigos (para saber cómo se llama ADMIN)", """
    SELECT id, nombre, codigo
    FROM sistema_facturacion.empresa_roles
    ORDER BY nombre
    LIMIT 20
""")

# 4. Subquery exacta del repository para representante
run("SUBQUERY REPRESENTANTE (como está en el repositorio)", """
    SELECT u3.nombres || ' ' || u3.apellidos as representante, er3.codigo as rol_codigo
    FROM sistema_facturacion.usuarios u3
    JOIN sistema_facturacion.empresa_roles er3 ON u3.empresa_rol_id = er3.id
    WHERE u3.empresa_id = %s
    ORDER BY (er3.codigo = 'ADMIN') DESC, u3.created_at ASC
    LIMIT 5
""", (EMPRESA_ID,))

# 5. ¿Hay alguna tabla 'users' separada de 'usuarios'?
run("¿Existe tabla 'users' separada de 'usuarios'?", """
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'sistema_facturacion'
      AND table_name IN ('users', 'usuarios')
""")

cur.close()
conn.close()
print("\n[DIAGNÓSTICO COMPLETADO]")
