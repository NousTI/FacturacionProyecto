from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from ..config.env import env

def add_cors_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=env.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
