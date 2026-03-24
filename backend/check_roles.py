import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

try:
    from src.config.env import env
    
    conn = psycopg2.connect(
        host=env.DB_HOST, 
        database=env.DB_NAME, 
        user=env.DB_USER, 
        password=env.DB_PASSWORD, 
        port=env.DB_PORT, 
        cursor_factory=RealDictCursor
    )
    with conn.cursor() as cur:
        output = ["Checking columns for sistema_facturacion.empresa_roles:"]
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'empresa_roles'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        for col in columns:
            output.append(f"- {col['column_name']} ({col['data_type']}), nullable: {col['is_nullable']}, default: {col['column_default']}")
            
        output.append("\nChecking latest created roles:")
        cur.execute("SELECT id, empresa_id, nombre, codigo, es_sistema, created_at FROM sistema_facturacion.empresa_roles ORDER BY created_at DESC LIMIT 5;")
        roles = cur.fetchall()
        for r in roles:
            output.append(f"- ROL: {r['nombre']} | E_ID: {r['empresa_id']} | COD: {r['codigo']} | ES_SIST: {r['es_sistema']} | AT: {r['created_at']}")

    conn.close()
    with open('roles_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
except Exception as e:
    with open('roles_report.txt', 'w', encoding='utf-8') as f:
        f.write(str(e))
