
import psycopg2
import json
from src.config.env import env

def analyze():
    conn = psycopg2.connect(env.database_url)
    cur = conn.cursor()
    
    print("--- DETALLE DE LOS ULTIMOS 5 LOGS ---")
    cur.execute("""
        SELECT l.factura_id, l.clave_acceso, l.estado, l.sri_estado_raw, 
               l.tipo_intento, l.intento_numero, l.timestamp, l.mensajes,
               l.fase_falla, l.xml_respuesta
        FROM sistema_facturacion.log_emision_facturas l 
        ORDER BY l.timestamp DESC 
        LIMIT 5
    """)
    rows = cur.fetchall()
    
    for row in rows:
        fid, clave, est, sri, type_int, num, ts, msg, fase, resp = row
        print(f"Factura: {fid} | TS: {ts}")
        print(f"  Clave: {clave}")
        print(f"  Estado Local: {est} | SRI: {sri} | Fase: {fase}")
        print(f"  Intento: {type_int} #{num}")
        print(f"  Mensajes: {json.dumps(msg, indent=2) if isinstance(msg, (list, dict)) else msg}")
        # print(f"  Respuesta SRI (primeros 200 chars): {str(resp)[:200]}")
        print("-" * 80)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    analyze()
