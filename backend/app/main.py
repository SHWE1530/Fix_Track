import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import (
    admin,
    assets,
    attachments,
    auth,
    businesses,
    estimates,
    notifications,
    passports,
    repair_jobs,
    sharing,
    users,
    warranties,
)
from app.core.config import settings
from app.db.init_indexes import init_db_indexes
from app.db.mongodb import DatabaseManager
from app.db.seed_data import seed_initial_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fixtrack")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB, create indexes, seed initial demo dataset
    logger.info("Initializing FixTrack Backend Services...")
    DatabaseManager.connect()
    init_db_indexes()
    seed_initial_data()
    yield
    # Shutdown
    logger.info("Shutting down FixTrack Backend...")
    DatabaseManager.disconnect()

app = FastAPI(
    title="FixTrack API",
    description="Cross-Service Repair Transparency & Customer-Controlled Repair Passport Platform",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact support or try again later."}
    )

# Include API v1 Routers
api_v1_router_list = [
    auth.router,
    users.router,
    businesses.router,
    assets.router,
    repair_jobs.router,
    estimates.router,
    warranties.router,
    attachments.router,
    passports.router,
    sharing.router,
    notifications.router,
    admin.router,
]

for router in api_v1_router_list:
    app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "platform": "FixTrack",
        "version": settings.VERSION,
        "database_mode": "mock" if DatabaseManager.is_mock else "mongodb_live",
        "api_v1_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
