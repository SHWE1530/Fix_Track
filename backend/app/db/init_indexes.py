import logging
from pymongo import ASCENDING, DESCENDING
from app.db.mongodb import get_db

logger = logging.getLogger("fixtrack.indexes")

def init_db_indexes(db=None):
    if db is None:
        db = get_db()
    
    try:
        # Users
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.users.create_index([("role", ASCENDING)])
        db.users.create_index([("created_at", DESCENDING)])

        # Businesses
        db.businesses.create_index([("owner_id", ASCENDING)])
        db.businesses.create_index([("is_verified", ASCENDING)])
        db.businesses.create_index([("categories", ASCENDING)])
        db.businesses.create_index([("created_at", DESCENDING)])

        # Memberships
        db.memberships.create_index([("business_id", ASCENDING), ("user_id", ASCENDING)], unique=True)
        db.memberships.create_index([("user_id", ASCENDING)])
        db.memberships.create_index([("business_id", ASCENDING)])

        # Assets
        db.assets.create_index([("owner_id", ASCENDING)])
        db.assets.create_index([("category", ASCENDING)])
        db.assets.create_index([("serial_number", ASCENDING)])

        # Repair Jobs
        db.repair_jobs.create_index([("job_number", ASCENDING)], unique=True)
        db.repair_jobs.create_index([("customer_id", ASCENDING)])
        db.repair_jobs.create_index([("business_id", ASCENDING)])
        db.repair_jobs.create_index([("asset_id", ASCENDING)])
        db.repair_jobs.create_index([("status", ASCENDING)])
        db.repair_jobs.create_index([("created_at", DESCENDING)])
        db.repair_jobs.create_index([("repeat_fault_of_job_id", ASCENDING)])

        # Estimates
        db.estimates.create_index([("job_id", ASCENDING), ("version", ASCENDING)], unique=True)
        db.estimates.create_index([("job_id", ASCENDING)])
        db.estimates.create_index([("status", ASCENDING)])

        # Job Events (Audit timeline for jobs)
        db.job_events.create_index([("job_id", ASCENDING), ("created_at", ASCENDING)])

        # Warranties
        db.warranties.create_index([("warranty_number", ASCENDING)], unique=True)
        db.warranties.create_index([("job_id", ASCENDING)])
        db.warranties.create_index([("asset_id", ASCENDING)])
        db.warranties.create_index([("customer_id", ASCENDING)])
        db.warranties.create_index([("business_id", ASCENDING)])

        # Attachments
        db.attachments.create_index([("job_id", ASCENDING)])
        db.attachments.create_index([("asset_id", ASCENDING)])
        db.attachments.create_index([("uploaded_by", ASCENDING)])

        # Sharing Grants
        db.sharing_grants.create_index([("asset_id", ASCENDING)])
        db.sharing_grants.create_index([("target_business_id", ASCENDING)])
        db.sharing_grants.create_index([("owner_id", ASCENDING)])
        db.sharing_grants.create_index([("status", ASCENDING)])
        db.sharing_grants.create_index([("token", ASCENDING)], sparse=True)

        # Notifications
        db.notifications.create_index([("user_id", ASCENDING), ("is_read", ASCENDING)])
        db.notifications.create_index([("created_at", DESCENDING)])

        # Audit Logs
        db.audit_logs.create_index([("action", ASCENDING)])
        db.audit_logs.create_index([("user_id", ASCENDING)])
        db.audit_logs.create_index([("created_at", DESCENDING)])

        logger.info("Successfully initialized all MongoDB indexes.")
    except Exception as e:
        logger.warning(f"Notice while initializing indexes: {e}")
