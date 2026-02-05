from contextlib import contextmanager
from psycopg2.extras import RealDictCursor

@contextmanager
def db_transaction(conn):
    """
    Context manager sencillo para manejar commit/rollback automáticamente.
    Garantiza el uso de RealDictCursor.
    """
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
