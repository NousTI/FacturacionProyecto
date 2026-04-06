from fastapi import Depends
from src.database.session import get_db

class BaseRepository:
    def __init__(self, db=Depends(get_db)):
        self.db = db
