import psycopg2

conn = psycopg2.connect('dbname=facturacion user=postgres password=root host=localhost')
cur = conn.cursor()
cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pago_gasto_metodo_pago_check';")
print(cur.fetchone()[0])
