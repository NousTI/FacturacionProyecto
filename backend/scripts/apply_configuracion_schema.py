# backend/scripts/apply_configuracion_schema.py

import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from config import get_db_config

def apply_schema():
    config = get_db_config()
    conn = psycopg2.connect(**config)
    cursor = conn.cursor()
    
    # Read schema file
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'configuracion_schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("Applying configuration schema...")
    cursor.execute(sql)
    conn.commit()
    print("Configuration schema applied successfully.")
    conn.close()

if __name__ == "__main__":
    apply_schema()
