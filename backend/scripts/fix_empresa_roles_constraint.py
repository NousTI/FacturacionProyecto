"""
Script para remover la restricción UNIQUE global en empresa_roles.codigo
y mantener solo la restricción compuesta (empresa_id, codigo)
"""
import psycopg2
from pathlib import Path

# Read .env from parent directory
env_file = Path(__file__).resolve().parent.parent / '.env'

def read_env(path):
    """Simple .env reader"""
    env = {}
    if path.exists():
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()
    return env

def fix_empresa_roles_constraint():
    """Fix the unique constraint on empresa_roles.codigo"""

    print(f"Reading env from: {env_file}")
    env = read_env(env_file)

    db_host = env.get('DB_HOST', 'localhost')
    db_port = int(env.get('DB_PORT', 5432))
    db_name = env.get('DB_NAME', 'sistema_facturacion')
    db_user = env.get('DB_USER', 'postgres')
    db_password = env.get('DB_PASSWORD')

    print(f"DB Config - Host: {db_host}, Port: {db_port}, Name: {db_name}, User: {db_user}")

    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )
    cur = conn.cursor()

    try:
        print("Removing global UNIQUE constraint on empresa_roles.codigo...")
        cur.execute("""
            ALTER TABLE sistema_facturacion.empresa_roles
            DROP CONSTRAINT IF EXISTS empresa_roles_codigo_key
        """)

        print("[OK] Constraint removed successfully!")

        # Verify the constraint was removed
        cur.execute("""
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'sistema_facturacion'
            AND table_name = 'empresa_roles'
            ORDER BY constraint_name
        """)
        remaining_constraints = [row[0] for row in cur.fetchall()]
        print(f"[OK] Remaining constraints: {', '.join(remaining_constraints)}")

        conn.commit()

    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        conn.rollback()
        exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_empresa_roles_constraint()
