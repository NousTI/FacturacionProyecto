from fastapi import Depends
from uuid import UUID
from datetime import date
from typing import List

from .repository import RepositorioModulos
from .schemas import ModuloCreacion, ModuloActualizacion, ModuloPlanCreacion
from ...errors.app_error import AppError

class ServicioModulos:
    def __init__(self, repo: RepositorioModulos = Depends()):
        self.repo = repo

    def listar_todos(self):
        return self.repo.listar_todos()

    def crear_modulo(self, datos: ModuloCreacion):
        if self.repo.obtener_por_codigo(datos.codigo):
            raise AppError(f"Código {datos.codigo} ya existe", 400, "MODULO_EXISTS")
        return self.repo.crear(datos.model_dump())

    def vincular_a_plan(self, plan_id: UUID, datos: ModuloPlanCreacion):
        return self.repo.vincular_a_plan(plan_id, datos.modulo_id, datos.incluido)

    def sincronizar(self, empresa_id: UUID, plan_id: UUID, fecha_vencimiento: date):
        return self.repo.sincronizar_plan_a_empresa(empresa_id, plan_id, fecha_vencimiento)

    def listar_por_empresa(self, empresa_id: UUID):
        return self.repo.listar_por_empresa(empresa_id)
