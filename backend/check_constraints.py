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
        output = ["Checking check constraints for sistema_facturacion.users_logs:"]
        cur.execute("""
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint
            WHERE conrelid = 'sistema_facturacion.users_logs'::regclass AND contype = 'c';
        """)
        constraints = cur.fetchall()
        for c in constraints:
            output.append(f"- {c['conname']}: {c['def']}")

    conn.close()
    with open('constraints_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
except Exception as e:
    with open('constraints_report.txt', 'w', encoding='utf-8') as f:
        f.write(str(e))
