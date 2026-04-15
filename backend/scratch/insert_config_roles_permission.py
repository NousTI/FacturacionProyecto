import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

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

conn = psycopg2.connect(
    host=env.DB_HOST,
    dbname=env.DB_NAME,
    user=env.DB_USER,
    password=env.DB_PASSWORD,
    port=env.DB_PORT,
    cursor_factory=RealDictCursor
)

with conn.cursor() as cur:
    # Verificar si ya existe
    cur.execute("""
        SELECT id, codigo, nombre FROM sistema_facturacion.empresa_permisos WHERE codigo = 'CONFIG_ROLES'
    """)
    existing = cur.fetchone()

    if existing:
        print(f"[INFO] Permiso CONFIG_ROLES ya existe: {dict(existing)}")
    else:
        cur.execute("""
            INSERT INTO sistema_facturacion.empresa_permisos (codigo, nombre, descripcion, modulo)
            VALUES ('CONFIG_ROLES', 'Gestionar Roles', 'Crear, editar y eliminar roles y sus permisos', 'CONFIGURACION')
            RETURNING id, codigo, nombre
        """)
        row = cur.fetchone()
        conn.commit()
        print(f"[OK] Permiso insertado: {dict(row)}")

conn.close()
