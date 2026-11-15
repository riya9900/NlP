import logging

import uvicorn
from fastapi import FastAPI

from app.config import get_settings
from app.middleware import register_middleware
from app.routes import analyze, demo, health, products, translate

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

logging.getLogger("httpx").setLevel(logging.WARNING)  # httpx logs full URLs incl. api_key

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")

register_middleware(app)

app.include_router(health.router)
app.include_router(products.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(translate.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
