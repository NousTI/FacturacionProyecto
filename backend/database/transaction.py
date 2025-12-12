# backend/database/transaction.py
from contextlib import contextmanager


@contextmanager
def db_transaction(conn):
    """
    Context manager sencillo para manejar commit/rollback automáticamente.
    """
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
