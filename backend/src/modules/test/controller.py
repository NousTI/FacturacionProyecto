from fastapi import Depends
from .services import ServicioTest

class TestController:
    def __init__(self, service: ServicioTest = Depends()):
        self.service = service

    def listar_items(self):
        items = self.service.obtener_todos()
        return {
            "items": items,
            "total": len(items),
            "mensaje": "Listado de mockup recuperado"
        }
