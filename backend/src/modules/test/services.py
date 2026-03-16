from uuid import uuid4
from .schemas import TestItem

class ServicioTest:
    def __init__(self):
        # Mockup data
        self.mock_db = [
            TestItem(id=uuid4(), nombre="Componente Alfa", valor=150.50),
            TestItem(id=uuid4(), nombre="Modulo Beta", valor=299.99),
            TestItem(id=uuid4(), nombre="Servicio Gamma", valor=50.00),
        ]

    def obtener_todos(self):
        return self.mock_db

    def crear_mock(self, nombre: str, valor: float):
        nuevo = TestItem(id=uuid4(), nombre=nombre, valor=valor)
        self.mock_db.append(nuevo)
        return nuevo
