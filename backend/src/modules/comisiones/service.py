from fastapi import Depends
from uuid import UUID
from datetime import date
from typing import List, Optional

from .repository import RepositorioComisiones
from .schemas import ComisionCreacion, ComisionActualizacion
from ..configuracion.service import ServicioConfiguracion
from ..empresa.repository import RepositorioEmpresa
from ..vendedores.repository import RepositorioVendedores
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioComisiones:
    def __init__(
        self,
        repo: RepositorioComisiones = Depends(),
        empresa_repo: RepositorioEmpresa = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        config_service: ServicioConfiguracion = Depends()
    ):
        self.repo = repo
        self.empresa_repo = empresa_repo
        self.vendedor_repo = vendedor_repo
        self.config_service = config_service

    def calcular_comision_potencial(self, empresa_id: UUID, monto_pago: float) -> Optional[dict]:
        empresa = self.empresa_repo.obtener_por_id(empresa_id)
        if not empresa or not empresa.get('vendedor_id'):
            return None
            
        vendedor = self.vendedor_repo.obtener_por_id(empresa['vendedor_id'])
        if not vendedor: return None

        tipo = (vendedor.get('tipo_comision') or 'PORCENTAJE').upper()
        
        if tipo == 'FIJO':
            monto = float(vendedor.get('porcentaje_comision') or 0)
            porcentaje = 0
        else:
            p_inicial = float(vendedor.get('porcentaje_comision_inicial') or 0)
            p_recurrente = float(vendedor.get('porcentaje_comision_recurrente') or 0)
            
            # Note: Count logic should be in repository or here
            # For now, let's keep it simple or assume we'll pass count if needed.
            # Following legacy logic:
            porcentaje = p_inicial if p_inicial > 0 else float(vendedor.get('porcentaje_comision') or 10)
            monto = float(monto_pago) * (porcentaje / 100.0)
            
        return {
            "vendedor_id": vendedor['id'],
            "monto": round(monto, 2),
            "porcentaje_aplicado": porcentaje,
            "estado": "PENDIENTE",
            "fecha_generacion": date.today()
        }

    def listar_comisiones(self, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR)
        
        if is_superadmin:
            return self.repo.listar_comisiones()
        if is_vendedor:
            return self.repo.listar_comisiones(vendedor_id=usuario_actual['id'])
        
        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def obtener_comision(self, id: UUID, usuario_actual: dict):
        comision = self.repo.obtener_por_id(id)
        if not comision: raise AppError("Comisión no encontrada", 404, "COMISION_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(comision['vendedor_id']) != str(usuario_actual['id']):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return comision

    def crear_manual(self, datos: ComisionCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.crear_comision(datos.model_dump())

    def actualizar(self, id: UUID, datos: ComisionActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.actualizar_comision(id, datos.model_dump(exclude_unset=True))

    def eliminar(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.eliminar_comision(id)
