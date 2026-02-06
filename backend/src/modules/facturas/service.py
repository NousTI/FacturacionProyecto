"""
Servicio de Facturas.

Este servicio maneja la lógica de negocio para facturas electrónicas
cumpliendo con las normativas del SRI Ecuador.

VALIDACIONES LEGALES IMPLEMENTADAS:
- Solo rol USUARIO puede operar facturas (excepto SUPERADMIN para soporte)
- Solo facturas en BORRADOR pueden editarse
- Solo facturas EMITIDAS pueden anularse (BORRADOR se elimina)
- Snapshots son inmutables una vez creada la factura
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import Depends

from .repository import RepositorioFacturas
from .schemas import FacturaCreacion, FacturaActualizacion, FacturaAnulacion, FacturaListadoFiltros
from .schemas_snapshots import (
    SnapshotEmpresa,
    SnapshotCliente, 
    SnapshotEstablecimiento,
    SnapshotPuntoEmision,
    SnapshotUsuario
)
from ..clientes.services import ServicioClientes
from ..establecimientos.service import ServicioEstablecimientos
from ..puntos_emision.service import ServicioPuntosEmision
from ..puntos_emision.repository import RepositorioPuntosEmision
from ..empresas.service import ServicioEmpresas
from ...constants.enums import AuthKeys
from ...constants.roles import RolCodigo
from ...errors.app_error import AppError


class ServicioFacturas:
    """Servicio para gestión de facturas electrónicas."""
    
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        cliente_service: ServicioClientes = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends(),
        punto_emision_service: ServicioPuntosEmision = Depends(),
        punto_emision_repo: RepositorioPuntosEmision = Depends(),
        empresa_service: ServicioEmpresas = Depends()
    ):
        self.repo = repo
        self.cliente_service = cliente_service
        self.establecimiento_service = establecimiento_service
        self.punto_emision_service = punto_emision_service
        self.punto_emision_repo = punto_emision_repo
        self.empresa_service = empresa_service

    # =================================================================
    # VALIDACIONES LEGALES
    # =================================================================

    def _validar_rol_usuario(self, usuario_actual: dict) -> None:
        """
        Valida que el usuario tenga rol USUARIO para operar facturas.
        
        REGLA DE NEGOCIO:
        - Solo usuarios con rol USUARIO pueden crear/emitir facturas
        - SUPERADMIN puede operar para soporte técnico
        - VENDEDOR no puede crear facturas directamente
        
        Raises:
            AppError: Si el rol no está autorizado
        """
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if is_superadmin:
            return  # SUPERADMIN tiene acceso total
        
        rol_codigo = usuario_actual.get("rol_codigo")
        if rol_codigo != RolCodigo.USUARIO.value:
            raise AppError(
                f"Solo usuarios con rol USUARIO pueden operar facturas. Rol actual: {rol_codigo}",
                403,
                "ROL_NO_AUTORIZADO"
            )

    def _validar_empresa_usuario(self, usuario_actual: dict) -> UUID:
        """
        Valida que el usuario pertenezca a una empresa.
        
        Returns:
            UUID: ID de la empresa del usuario
            
        Raises:
            AppError: Si el usuario no tiene empresa asignada
        """
        empresa_id = usuario_actual.get("empresa_id")
        if not empresa_id:
            raise AppError(
                "Usuario sin empresa asignada. No puede operar facturas.",
                400,
                "AUTH_NO_EMPRESA"
            )
        return UUID(str(empresa_id))

    def _validar_estado_borrador(self, factura: dict) -> None:
        """
        Valida que la factura esté en estado BORRADOR para permitir edición.
        
        REGLA LEGAL:
        Facturas emitidas son documentos tributarios inmutables.
        Solo pueden modificarse mientras están en BORRADOR.
        
        Raises:
            AppError: Si la factura no está en BORRADOR
        """
        estado = factura.get('estado')
        if estado != 'BORRADOR':
            raise AppError(
                f"No se puede modificar una factura en estado {estado}. "
                f"Solo las facturas en BORRADOR pueden editarse.",
                400,
                "FACTURA_NO_EDITABLE"
            )

    def _validar_estado_para_anular(self, factura: dict) -> None:
        """
        Valida que la factura pueda ser anulada.
        
        REGLAS LEGALES:
        - BORRADOR: Debe eliminarse, no anularse
        - EMITIDA: Puede anularse (cambia a ANULADA)
        - ANULADA: No puede volver a anularse
        
        Raises:
            AppError: Si la factura no puede anularse
        """
        estado = factura.get('estado')
        
        if estado == 'BORRADOR':
            raise AppError(
                "Las facturas en BORRADOR deben eliminarse, no anularse. "
                "Use el endpoint DELETE para eliminar borradores.",
                400,
                "FACTURA_BORRADOR_ELIMINAR"
            )
        
        if estado == 'ANULADA':
            raise AppError(
                "La factura ya está anulada.",
                400,
                "FACTURA_YA_ANULADA"
            )
        
        if estado != 'EMITIDA':
            raise AppError(
                f"Solo las facturas EMITIDAS pueden anularse. Estado actual: {estado}",
                400,
                "FACTURA_ESTADO_INVALIDO"
            )

    def _validar_estado_para_eliminar(self, factura: dict) -> None:
        """
        Valida que la factura pueda ser eliminada.
        
        REGLA LEGAL:
        Solo facturas en BORRADOR pueden eliminarse.
        Facturas emitidas deben anularse.
        
        Raises:
            AppError: Si la factura no puede eliminarse
        """
        estado = factura.get('estado')
        
        if estado == 'EMITIDA':
            raise AppError(
                "Las facturas EMITIDAS no pueden eliminarse. Debe anularlas en su lugar.",
                400,
                "FACTURA_NO_ELIMINABLE"
            )
        
        if estado == 'ANULADA':
            raise AppError(
                "Las facturas ANULADAS no pueden eliminarse por motivos de auditoría.",
                400,
                "FACTURA_NO_ELIMINABLE"
            )

    # =================================================================
    # CONSTRUCTORES DE SNAPSHOTS
    # =================================================================

    def _construir_snapshot_empresa(self, empresa: dict) -> dict:
        """Construye snapshot de la empresa emisora."""
        return SnapshotEmpresa(
            ruc=empresa['ruc'],
            razon_social=empresa['razon_social'],
            nombre_comercial=empresa.get('nombre_comercial'),
            direccion=empresa['direccion'],
            tipo_contribuyente=empresa['tipo_contribuyente'],
            obligado_contabilidad=empresa.get('obligado_contabilidad', False),
            email=empresa.get('email'),
            telefono=empresa.get('telefono'),
            logo_url=empresa.get('logo_url'),
            snapshot_timestamp=datetime.utcnow()
        ).model_dump()

    def _construir_snapshot_cliente(self, cliente: dict) -> dict:
        """Construye snapshot del cliente receptor."""
        return SnapshotCliente(
            identificacion=cliente['identificacion'],
            tipo_identificacion=cliente['tipo_identificacion'],
            razon_social=cliente['razon_social'],
            nombre_comercial=cliente.get('nombre_comercial'),
            direccion=cliente.get('direccion'),
            email=cliente.get('email'),
            telefono=cliente.get('telefono'),
            ciudad=cliente.get('ciudad'),
            provincia=cliente.get('provincia'),
            snapshot_timestamp=datetime.utcnow()
        ).model_dump()

    def _construir_snapshot_establecimiento(self, establecimiento: dict) -> dict:
        """Construye snapshot del establecimiento emisor."""
        return SnapshotEstablecimiento(
            codigo=establecimiento['codigo'],
            nombre=establecimiento['nombre'],
            direccion=establecimiento['direccion'],
            snapshot_timestamp=datetime.utcnow()
        ).model_dump()

    def _construir_snapshot_punto_emision(self, punto: dict, secuencial: int) -> dict:
        """Construye snapshot del punto de emisión con el secuencial usado."""
        return SnapshotPuntoEmision(
            codigo=punto['codigo'],
            nombre=punto['nombre'],
            secuencial_usado=secuencial,
            snapshot_timestamp=datetime.utcnow()
        ).model_dump()

    def _construir_snapshot_usuario(self, usuario_actual: dict) -> dict:
        """Construye snapshot del usuario que crea la factura."""
        return SnapshotUsuario(
            nombres=usuario_actual.get('nombres', ''),
            apellidos=usuario_actual.get('apellidos', ''),
            email=usuario_actual.get('email', ''),
            rol_codigo=usuario_actual.get('rol_codigo'),
            rol_nombre=usuario_actual.get('rol_nombre'),
            snapshot_timestamp=datetime.utcnow()
        ).model_dump()

    # =================================================================
    # OPERACIONES CRUD
    # =================================================================

    def crear_factura(self, datos: FacturaCreacion, usuario_actual: dict):
        """
        Crea una nueva factura en estado BORRADOR.
        
        FLUJO:
        1. Valida rol de usuario (solo USUARIO)
        2. Valida entidades relacionadas
        3. Genera número secuencial
        4. Construye snapshots de todas las entidades
        5. Crea la factura con estado BORRADOR
        
        Args:
            datos: FacturaCreacion con los datos de la factura
            usuario_actual: Dict con datos del usuario autenticado
            
        Returns:
            Dict con la factura creada
            
        Raises:
            AppError: Si hay errores de validación o permisos
        """
        # Validaciones de rol y empresa
        self._validar_rol_usuario(usuario_actual)
        
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id or not datos.usuario_id:
                raise AppError(
                    "Superadmin debe especificar 'empresa_id' y 'usuario_id'",
                    400,
                    "VAL_ERROR"
                )
            target_empresa_id = datos.empresa_id
            target_usuario_id = datos.usuario_id
        else:
            target_empresa_id = self._validar_empresa_usuario(usuario_actual)
            target_usuario_id = UUID(str(usuario_actual.get("id")))
            
            if datos.empresa_id and str(datos.empresa_id) != str(target_empresa_id):
                raise AppError(
                    "No puede crear facturas para otra empresa",
                    403,
                    "AUTH_FORBIDDEN"
                )
            if datos.usuario_id and str(datos.usuario_id) != str(target_usuario_id):
                raise AppError(
                    "No puede asignar la factura a otro usuario",
                    403,
                    "AUTH_FORBIDDEN"
                )

        # Obtener entidades relacionadas (valida existencia y permisos)
        cliente = self.cliente_service.obtener_cliente(datos.cliente_id, usuario_actual)
        establecimiento = self.establecimiento_service.obtener_establecimiento(
            datos.establecimiento_id, usuario_actual
        )
        punto = self.punto_emision_service.obtener_punto(datos.punto_emision_id, usuario_actual)
        
        # Obtener empresa para el snapshot
        empresa = self.empresa_service.obtener_empresa(target_empresa_id, usuario_actual)

        # Validar que punto pertenece al establecimiento
        if str(punto['establecimiento_id']) != str(datos.establecimiento_id):
            raise AppError(
                "El punto de emisión no pertenece al establecimiento indicado",
                400,
                "VAL_ERROR"
            )

        # Generar número secuencial
        secuencial = self.punto_emision_repo.incrementar_secuencial(datos.punto_emision_id)
        if secuencial is None:
            raise AppError("Error al generar secuencial", 500, "DB_ERROR")

        numero_factura = f"{establecimiento['codigo']}-{punto['codigo']}-{secuencial:09d}"
        
        # Construir snapshots
        snapshots = {
            "snapshot_empresa": self._construir_snapshot_empresa(empresa),
            "snapshot_cliente": self._construir_snapshot_cliente(cliente),
            "snapshot_establecimiento": self._construir_snapshot_establecimiento(establecimiento),
            "snapshot_punto_emision": self._construir_snapshot_punto_emision(punto, secuencial),
            "snapshot_usuario": self._construir_snapshot_usuario(usuario_actual)
        }
        
        # Preparar payload
        payload = datos.model_dump()
        payload.update({
            "empresa_id": target_empresa_id,
            "usuario_id": target_usuario_id,
            "numero_factura": numero_factura,
            "estado": 'BORRADOR',  # Siempre inicia en BORRADOR
            "estado_pago": 'PENDIENTE',
            **snapshots
        })

        try:
            nueva = self.repo.crear_factura(payload)
            if not nueva:
                raise AppError("Error al crear la factura", 500, "DB_ERROR")
            return nueva
        except Exception as e:
            raise e

    def listar_facturas(
        self,
        usuario_actual: dict,
        empresa_id: Optional[UUID] = None,
        filtros: Optional[FacturaListadoFiltros] = None,
        solo_propias: bool = False,
        limit: int = 100,
        offset: int = 0
    ):
        """
        Lista facturas según permisos del usuario.
        
        PERMISOS:
        - FACTURAS_VER_TODAS: Ve todas las facturas de la empresa
        - FACTURAS_VER_PROPIAS: Solo ve facturas creadas por él
        - SUPERADMIN: Ve todas las facturas (todas las empresas si no especifica empresa_id)
        
        Args:
            usuario_actual: Dict con datos del usuario autenticado
            empresa_id: Filtrar por empresa (solo SUPERADMIN)
            filtros: Filtros adicionales (estado, fechas, etc.)
            solo_propias: Si True, filtra solo facturas del usuario
            limit: Límite de resultados
            offset: Offset para paginación
            
        Returns:
            List[Dict] con las facturas
        """
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = None
        target_usuario_id = None
        
        if is_superadmin:
            target_empresa_id = empresa_id  # Opcional para superadmin
        else:
            target_empresa_id = usuario_actual.get("empresa_id")
            
            # Si solo_propias, filtrar por usuario
            if solo_propias:
                target_usuario_id = usuario_actual.get("id")
        
        return self.repo.listar_facturas(
            empresa_id=target_empresa_id,
            usuario_id=target_usuario_id,
            filtros=filtros,
            limit=limit,
            offset=offset
        )

    def obtener_factura(self, id: UUID, usuario_actual: dict):
        """
        Obtiene una factura por ID con validación de permisos.
        
        Args:
            id: UUID de la factura
            usuario_actual: Dict con datos del usuario autenticado
            
        Returns:
            Dict con la factura
            
        Raises:
            AppError: Si no existe o no tiene permisos
        """
        factura = self.repo.obtener_por_id(id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")

        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(factura['empresa_id']) != str(usuario_actual.get("empresa_id")):
                raise AppError(
                    "No tiene permiso para ver esta factura",
                    403,
                    "AUTH_FORBIDDEN"
                )

        return factura

    def actualizar_factura(
        self,
        id: UUID,
        datos: FacturaActualizacion,
        usuario_actual: dict,
        forma_pago_service=None
    ):
        """
        Actualiza una factura.
        
        RESTRICCIÓN LEGAL:
        Solo facturas en estado BORRADOR pueden actualizarse.
        
        Args:
            id: UUID de la factura
            datos: FacturaActualizacion con los campos a actualizar
            usuario_actual: Dict con datos del usuario autenticado
            
        Returns:
            Dict con la factura actualizada
            
        Raises:
            AppError: Si no puede actualizarse
        """
        self._validar_rol_usuario(usuario_actual)
        factura = self.obtener_factura(id, usuario_actual)
        
        # Validar que esté en BORRADOR
        self._validar_estado_borrador(factura)
        
        payload = datos.model_dump(exclude_unset=True)
        if not payload:
            return factura
        
        actualizada = self.repo.actualizar_factura(id, payload)
        if not actualizada:
            raise AppError("Error al actualizar la factura", 500, "DB_ERROR")
        return actualizada

    def anular_factura(
        self,
        id: UUID,
        datos: FacturaAnulacion,
        usuario_actual: dict
    ):
        """
        Anula una factura emitida.
        
        RESTRICCIONES LEGALES:
        - Solo facturas EMITIDAS pueden anularse
        - Facturas en BORRADOR deben eliminarse
        - La razón de anulación es obligatoria para auditoría SRI
        
        Args:
            id: UUID de la factura
            datos: FacturaAnulacion con la razón
            usuario_actual: Dict con datos del usuario autenticado
            
        Returns:
            Dict con la factura anulada
            
        Raises:
            AppError: Si no puede anularse
        """
        self._validar_rol_usuario(usuario_actual)
        factura = self.obtener_factura(id, usuario_actual)
        
        # Validar que pueda anularse
        self._validar_estado_para_anular(factura)
        
        # Actualizar estado
        payload = {
            "estado": "ANULADA",
            "razon_anulacion": datos.razon_anulacion
        }
        
        anulada = self.repo.actualizar_factura(id, payload)
        if not anulada:
            raise AppError("Error al anular la factura", 500, "DB_ERROR")
        
        # TODO: Registrar en log_emision_facturas el evento de anulación
        # TODO: Notificar al SRI si corresponde
        
        return anulada

    def eliminar_factura(self, id: UUID, usuario_actual: dict):
        """
        Elimina una factura.
        
        RESTRICCIÓN LEGAL:
        Solo facturas en estado BORRADOR pueden eliminarse.
        Las facturas EMITIDAS deben anularse.
        Las facturas ANULADAS no pueden eliminarse (auditoría).
        
        Args:
            id: UUID de la factura
            usuario_actual: Dict con datos del usuario autenticado
            
        Returns:
            bool: True si se eliminó correctamente
            
        Raises:
            AppError: Si no puede eliminarse
        """
        self._validar_rol_usuario(usuario_actual)
        factura = self.obtener_factura(id, usuario_actual)
        
        # Validar que pueda eliminarse
        self._validar_estado_para_eliminar(factura)
        
        if not self.repo.eliminar_factura(id):
            raise AppError("Error al eliminar la factura", 500, "DB_ERROR")
        return True

    # =================================================================
    # OPERACIONES DE DETALLES
    # =================================================================

    def agregar_detalle(self, datos: dict, usuario_actual: dict):
        """Agrega un detalle a una factura en BORRADOR."""
        factura = self.obtener_factura(datos['factura_id'], usuario_actual)
        self._validar_estado_borrador(factura)
        return self.repo.crear_detalle(datos)

    def listar_detalles(self, factura_id: UUID, usuario_actual: dict):
        """Lista los detalles de una factura."""
        self.obtener_factura(factura_id, usuario_actual)
        return self.repo.listar_detalles(factura_id)

    def actualizar_detalle(self, id: UUID, datos: dict, usuario_actual: dict):
        """Actualiza un detalle de una factura en BORRADOR."""
        detalle = self.repo.obtener_detalle(id)
        if not detalle:
            raise AppError("Detalle no encontrado", 404, "DETALLE_NOT_FOUND")
        
        factura = self.obtener_factura(detalle['factura_id'], usuario_actual)
        self._validar_estado_borrador(factura)
        return self.repo.actualizar_detalle(id, datos)

    def eliminar_detalle(self, id: UUID, usuario_actual: dict):
        """Elimina un detalle de una factura en BORRADOR."""
        detalle = self.repo.obtener_detalle(id)
        if not detalle:
            raise AppError("Detalle no encontrado", 404, "DETALLE_NOT_FOUND")
        
        factura = self.obtener_factura(detalle['factura_id'], usuario_actual)
        self._validar_estado_borrador(factura)
        return self.repo.eliminar_detalle(id)
