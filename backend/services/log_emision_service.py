from fastapi import Depends, HTTPException
from typing import List, Optional
from uuid import UUID

from repositories.log_emision_repository import LogEmisionRepository
from models.LogEmision import LogEmisionCreate, LogEmisionRead

class LogEmisionService:
    def __init__(self, repository: LogEmisionRepository = Depends()):
        self.repository = repository

    def create(self, data: LogEmisionCreate) -> LogEmisionRead:
        # Internal creation logic generally, but exposed if needed
        raw_data = data.dict()
        created = self.repository.create(raw_data)
        if not created:
            raise HTTPException(status_code=500, detail="Error creating Log")
        return LogEmisionRead(**created)

    def list(self, limit: int = 100, offset: int = 0) -> List[LogEmisionRead]:
        # Usually internal logs have sensitive info? Maybe not here.
        records = self.repository.list(limit, offset)
        return [LogEmisionRead(**r) for r in records]
        
    def get_by_factura(self, factura_id: UUID) -> List[LogEmisionRead]:
        records = self.repository.get_by_factura_id(factura_id)
        return [LogEmisionRead(**r) for r in records]
