from uuid import UUID
from fastapi import Depends

from . import ServicioFacturaCore, ServicioSRIFacturas
from ..schemas_logs import LogEmisionCreacion, AutorizacionSRICreacion
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError
from ...usuarios.repositories import RepositorioUsuarios
from .service_base import ValidacionesFactura
from ...cuentas_cobrar.repository import RepositorioCuentasCobrar

class ServicioAutorizacion:
    def __init__(
        self, 
        core: ServicioFacturaCore = Depends(),
        sri_facturacion: ServicioSRIFacturas = Depends(),
        usuario_repo: RepositorioUsuarios = Depends(),
        cuentas_cobrar_repo: RepositorioCuentasCobrar = Depends()
    ):
        self.core = core
        self.sri_facturacion = sri_facturacion
        self.usuario_repo = usuario_repo
        self.cuentas_cobrar_repo = cuentas_cobrar_repo

    def _preparar_usuario(self, usuario_actual: dict):
        """Asegura que el usuario tenga el usuario_facturacion_id para las validaciones."""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            u_fact = self.usuario_repo.obtener_por_user_id(usuario_actual['id'])
            if u_fact:
                usuario_actual['usuario_facturacion_id'] = u_fact['id']
        return usuario_actual

    def registrar_autorizacion_sri(self, datos: AutorizacionSRICreacion, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, datos.factura_id, usuario_actual)
        res = self.sri_facturacion.registrar_autorizacion_final(datos)
        
        update_data = {
            "estado": "AUTORIZADA",
            "clave_acceso": datos.numero_autorizacion,
            "numero_autorizacion": datos.numero_autorizacion,
            "fecha_autorizacion": datos.fecha_autorizacion,
            "fecha_emision": datos.fecha_autorizacion # Sincronización solicitada
        }
        self.core.actualizar_factura(datos.factura_id, update_data)
        return res

    def registrar_intento_emision(self, datos: LogEmisionCreacion, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, datos.factura_id, usuario_actual)
        return self.sri_facturacion.registrar_intento_emision(datos)

    def emitir_sri(self, id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        usuario_contexto = usuario_actual.copy()
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if 'usuario_facturacion_id' not in usuario_actual:
                raise AppError("Usuario no encontrado en sistema de facturación", 404, "USUARIO_NOT_FOUND")
            usuario_contexto["id"] = usuario_actual['usuario_facturacion_id']
            
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, id, usuario_actual)
        
        estados_permitidos = ['BORRADOR', 'DEVUELTA', 'ERROR_TECNICO']
        if factura.get('estado') not in estados_permitidos:
             raise AppError(f"La factura está en estado {factura.get('estado')} y no puede ser emitida.", 400)

        debe_asignar_nuevo = False
        
        if not factura.get('numero_factura'):
            debe_asignar_nuevo = True
            print(f"--- [SERVICE] Primer intento para factura {id}. Asignando nuevo secuencial. ---")
        elif factura.get('estado') == 'DEVUELTA':
            historial = self.sri_facturacion.obtener_historial_emision(id)
            if historial:
                ultimo_log = historial[0]
                mensajes = ultimo_log.get('mensajes', []) or []
                es_error_45 = any(str(m.get('codigo')) == '45' or 'SECUENCIAL REGISTRADO' in str(m.get('mensaje', '')).upper() for m in mensajes)
                
                if es_error_45:
                    print(f"--- [SERVICE] Detectado Error 45 previo en {id}. Intentando RESCATE por consulta... ---")
                    try:
                        res_consulta = self.consultar_sri(id, usuario_actual)
                        if res_consulta.get('estado') == 'AUTORIZADO':
                            print(f"--- [SERVICE] ¡RESCATE EXITOSO! Secuencial {factura.get('numero_factura')} ya autorizado. ---")
                            return res_consulta
                        
                        debe_asignar_nuevo = True
                        print(f"--- [SERVICE] Rescate fallido para {id}. Forzando salto de secuencial para desbloquear. ---")
                    except Exception as e:
                        print(f"--- [SERVICE] Error durante intento de rescate: {str(e)}. No se saltará secuencial aún por seguridad. ---")
                        debe_asignar_nuevo = False
            
            if not debe_asignar_nuevo:
                print(f"--- [SERVICE] Reintentando factura {id} (DEVUELTA) con el mismo número: {factura.get('numero_factura')} ---")

        if debe_asignar_nuevo:
            print(f"--- [SERVICE] Generando nuevo secuencial para factura {id} ---")
            punto = self.core.punto_emision_service.obtener_punto(factura['punto_emision_id'], usuario_actual)
            establecimiento = self.core.establecimiento_service.obtener_establecimiento(factura['establecimiento_id'], usuario_actual)
            
            secuencial = self.core.punto_emision_repo.incrementar_secuencial(factura['punto_emision_id'])
            if secuencial is None:
                raise AppError("No se pudo obtener el secuencial del punto de emisión", 500)
            
            numero_factura = f"{establecimiento['codigo']}-{punto['codigo']}-{secuencial:09d}"
            
            update_data = {
                "numero_factura": numero_factura,
                "secuencial_punto_emision": secuencial
            }
            
            snapshot_pto = factura.get('snapshot_punto_emision', {})
            snapshot_pto['secuencial_usado'] = secuencial
            update_data['snapshot_punto_emision'] = snapshot_pto
            
            self.core.actualizar_factura(id, update_data)
            
            # Sincronizar número oficial con Cuentas por Cobrar
            self.cuentas_cobrar_repo.actualizar_por_factura(id, {"numero_documento": numero_factura})
            
            print(f"Factura {id} ahora tiene el número {numero_factura}. Procediendo al SRI...")
        else:
            print(f"--- [SERVICE] Reutilizando número {factura.get('numero_factura')} para factura {id}. Procediendo al SRI... ---")
        
        return self.sri_facturacion.emitir_factura(id, usuario_contexto)

    def consultar_sri(self, id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        factura = ValidacionesFactura.obtener_y_validar_factura(self.core, id, usuario_actual)
        
        usuario_contexto = usuario_actual.copy()
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if 'usuario_facturacion_id' in usuario_actual:
                usuario_contexto['id'] = usuario_actual['usuario_facturacion_id']
        
        return self.sri_facturacion.consultar_estado(id, usuario_contexto)

    def obtener_historial_emision(self, factura_id: UUID, usuario_actual: dict):
        usuario_actual = self._preparar_usuario(usuario_actual)
        ValidacionesFactura.obtener_y_validar_factura(self.core, factura_id, usuario_actual)
        return self.sri_facturacion.obtener_historial_emision(factura_id)
