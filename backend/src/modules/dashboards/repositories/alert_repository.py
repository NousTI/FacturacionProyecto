from datetime import datetime, timedelta
from typing import List, Dict, Any
from .base import BaseRepository

class AlertRepository(BaseRepository):
    def obtener_alertas_sistema(self, vendedor_id=None, empresa_id=None) -> Dict[str, List[Dict[str, Any]]]:
        """Obtiene alertas categorizadas por rol."""
        alertas = {"criticas": [], "advertencias": [], "informativas": []}
        
        with self.db.cursor() as cur:
            if empresa_id:
                # Alertas para Empresa
                cur.execute("""
                    SELECT s.fecha_fin as fecha_vencimiento 
                    FROM sistema_facturacion.suscripciones s 
                    WHERE s.empresa_id = %s AND s.estado = 'ACTIVA'
                """, (empresa_id,))
                row = cur.fetchone()
                if row and row['fecha_vencimiento']:
                    fecha_venc = row['fecha_vencimiento']
                    if hasattr(fecha_venc, 'date'): fecha_venc = fecha_venc.date()
                    if fecha_venc < (datetime.now().date() + timedelta(days=7)):
                        alertas["criticas"].append({
                            "tipo": "Suscripción", "cantidad": 1, "nivel": "critical", "mensaje": "Su suscripción vence pronto"
                        })
            
            elif vendedor_id:
                # Alertas para Vendedor
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE e.vendedor_id = %s AND s.fecha_fin < CURRENT_DATE AND e.activo = true
                """, (vendedor_id,))
                vencidas = cur.fetchone()['count']
                if vencidas > 0:
                    alertas["criticas"].append({
                        "tipo": "Clientes Vencidos", "cantidad": vencidas, "nivel": "critical", "mensaje": f"{vencidas} de sus empresas tienen pagos atrasados"
                    })
            else:
                # Alertas Globales (Superadmin)
                cur.execute("""
                    SELECT COUNT(*) as count FROM sistema_facturacion.empresas 
                    WHERE id NOT IN (SELECT DISTINCT empresa_id FROM sistema_facturacion.facturas WHERE fecha_emision > CURRENT_DATE - INTERVAL '30 days')
                """)
                inactivas = cur.fetchone()['count']
                if inactivas > 0:
                    alertas["advertencias"].append({
                        "tipo": "Inactividad", "cantidad": inactivas, "nivel": "warning", "mensaje": f"{inactivas} empresas sin facturación en 30 días"
                    })

                cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.comisiones WHERE estado = 'PENDIENTE'")
                comisiones = cur.fetchone()['count']
                if comisiones > 0:
                    alertas["informativas"].append({
                        "tipo": "Comisiones", "cantidad": comisiones, "nivel": "info", "mensaje": f"{comisiones} comisiones por liquidar a vendedores"
                    })

                try:
                    cur.execute("""
                        SELECT COUNT(*) as count FROM sistema_facturacion.configuraciones_sri 
                        WHERE fecha_expiracion_cert <= CURRENT_DATE + INTERVAL '15 days' AND estado = 'ACTIVO'
                    """)
                    cert_vencidos = cur.fetchone()['count']
                    if cert_vencidos > 0:
                        alertas["criticas"].append({
                            "tipo": "Certificados SRI", "cantidad": cert_vencidos, "nivel": "critical", "mensaje": f"{cert_vencidos} empresas con firma electrónica próxima a vencer"
                        })
                except: pass

        return alertas
