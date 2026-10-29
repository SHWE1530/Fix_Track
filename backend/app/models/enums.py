from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    BUSINESS_OWNER = "business_owner"
    TECHNICIAN = "technician"
    ADMIN = "admin"

class MembershipRole(str, Enum):
    OWNER = "owner"
    TECHNICIAN = "technician"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    INVITED = "invited"
    SUSPENDED = "suspended"

class AssetCategory(str, Enum):
    SMARTPHONES_TABLETS = "smartphones_tablets"
    LAPTOPS_COMPUTERS = "laptops_computers"
    HOME_APPLIANCES = "home_appliances"
    BICYCLES = "bicycles"
    CARS_MOTORCYCLES = "cars_motorcycles"
    FURNITURE = "furniture"
    OTHER = "other"

class JobStatus(str, Enum):
    REQUESTED = "REQUESTED"
    CHECKED_IN = "CHECKED_IN"
    DIAGNOSING = "DIAGNOSING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    READY_FOR_COLLECTION = "READY_FOR_COLLECTION"
    COLLECTED = "COLLECTED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class EstimateStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"

class EstimateDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"

class WarrantyStatus(str, Enum):
    ACTIVE = "active"
    CLAIMED = "claimed"
    EXPIRED = "expired"
    VOIDED = "voided"

class SharingGrantStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"

class NotificationType(str, Enum):
    JOB_STATUS_CHANGED = "job_status_changed"
    ESTIMATE_SUBMITTED = "estimate_submitted"
    ESTIMATE_DECIDED = "estimate_decided"
    WARRANTY_ISSUED = "warranty_issued"
    SHARING_GRANTED = "sharing_granted"
    SHARING_REVOKED = "sharing_revoked"
    REPEAT_FAULT_LOGGED = "repeat_fault_logged"
    STAFF_INVITED = "staff_invited"
    BUSINESS_VERIFIED = "business_verified"
    SYSTEM_ALERT = "system_alert"

class AuditAction(str, Enum):
    USER_REGISTERED = "user_registered"
    USER_LOGIN = "user_login"
    BUSINESS_CREATED = "business_created"
    BUSINESS_VERIFIED = "business_verified"
    MEMBERSHIP_INVITED = "membership_invited"
    MEMBERSHIP_UPDATED = "membership_updated"
    ASSET_CREATED = "asset_created"
    ASSET_UPDATED = "asset_updated"
    JOB_CREATED = "job_created"
    JOB_STATUS_TRANSITION = "job_status_transition"
    ESTIMATE_CREATED = "estimate_created"
    ESTIMATE_SUBMITTED = "estimate_submitted"
    ESTIMATE_DECISION = "estimate_decision"
    WARRANTY_CREATED = "warranty_created"
    SHARING_GRANTED = "sharing_granted"
    SHARING_REVOKED = "sharing_revoked"
    ATTACHMENT_UPLOADED = "attachment_uploaded"
    ACCOUNT_SUSPENDED = "account_suspended"
