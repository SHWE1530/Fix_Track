import logging
from typing import Optional
from pymongo import MongoClient
import mongomock
from app.core.config import settings

logger = logging.getLogger("fixtrack.db")

class DatabaseManager:
    client: Optional[MongoClient] = None
    db = None
    is_mock: bool = False

    @classmethod
    def connect(cls, force_mock: bool = False):
        if force_mock:
            logger.info("Initializing in-memory Mock MongoDB client (mongomock)...")
            cls.client = mongomock.MongoClient()
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            cls.is_mock = True
            return

        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            # Set short serverSelectionTimeoutMS so we fail fast to mock if no server is running
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000
            )
            # Ping database to confirm connection
            client.admin.command('ping')
            cls.client = client
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            cls.is_mock = False
            logger.info(f"Successfully connected to real MongoDB: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            if settings.USE_MOCK_DB_IF_UNAVAILABLE:
                logger.warning(
                    f"Could not connect to live MongoDB at {settings.MONGODB_URI}: {e}. "
                    "Falling back to high-fidelity in-memory Mock MongoDB (mongomock)."
                )
                cls.client = mongomock.MongoClient()
                cls.db = cls.client[settings.MONGODB_DB_NAME]
                cls.is_mock = True
            else:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise e

    @classmethod
    def disconnect(cls):
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB client disconnected.")

def get_db():
    """FastAPI dependency for accessing the database."""
    if DatabaseManager.db is None:
        DatabaseManager.connect()
    return DatabaseManager.db

def get_client() -> MongoClient:
    if DatabaseManager.client is None:
        DatabaseManager.connect()
    return DatabaseManager.client
