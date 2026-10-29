# FixTrack Architecture & System Design

## 1. System Overview
FixTrack is a cross-service repair transparency platform connecting customers, independent repair businesses, technicians, and platform administrators.

Its central innovation is the **Customer-Controlled Repair Passport**, allowing item owners to preserve, inspect, and grant time-limited, revocable access to authorized repair records across multiple independent repair providers.

```
       +-------------------------------------------------------------+
       |               React SPA (Vite + JavaScript)                 |
       |  - Public Portal (Directory, Categories, How-it-Works)      |
       |  - Customer Portal (Assets, Jobs, Estimates, Passports)     |
       |  - Business Portal (Intake, Diagnoses, Estimates, Warranties|
       |  - Admin Portal (Verifications, Audit, Moderation)          |
       +------------------------------+------------------------------+
                                      | HTTPS / REST JSON
                                      v
       +-------------------------------------------------------------+
       |                  FastAPI Backend (/api/v1)                  |
       |  - Security & RBAC Middleware (JWT Bearer Token)            |
       |  - Role & Permission Layer (Customer, Owner, Tech, Admin)   |
       |  - Workflow Engine (Strict State Transitions)               |
       |  - Estimate Versioning Engine (Immutable Once Submitted)    |
       |  - Passport Sharing Engine (Granular Record Access Control) |
       |  - Audit & Notification Broker                              |
       +------------------------------+------------------------------+
                                      | PyMongo / Mongo Driver
                                      v
       +-------------------------------------------------------------+
       |                     MongoDB Database                        |
       |  Collections: users, businesses, memberships, assets,       |
       |  repair_jobs, estimates, job_events, warranties,            |
       |  attachments, sharing_grants, notifications                 |
       +-------------------------------------------------------------+
```

## 2. Core Architectural Principles

1. **Explicit Server-Side Authorization**:
   - The server inspects the authenticated JWT token for the user's Identity (`user_id`).
   - Customer ownership is strictly checked on asset, repair job, warranty, and sharing grant operations.
   - Business permissions distinguish between **Business Owner** (can manage memberships, settings, categories) and **Technician** (can perform diagnostics, intake, estimates, repair execution).
   - Platform administrators can verify businesses and inspect audit logs, but cannot view private customer repair records without an active sharing grant or explicit customer consent.

2. **Immutable Estimate Versioning**:
   - Every estimate starts at version 1 (`v1`).
   - Once submitted to the customer (`AWAITING_APPROVAL`), its line items, totals, and notes are frozen and immutable.
   - If the customer rejects or requests changes, the business creates a new draft version (e.g. `v2`).
   - The prior version remains unchanged in history for auditability.
   - Repair work requiring approval can never start until an approved estimate version exists.

3. **Customer-Controlled Repair Passport**:
   - Each asset maintains a complete service ledger.
   - Private technician notes remain hidden from the public/passport view.
   - Customers create `sharing_grants` designating:
     - Specific recipient business
     - Selected repair record IDs
     - Expiration date
     - Revocation capability at any time
   - When a business queries an asset or passport, the backend enforces that either:
     - The business has an active repair job with that asset, OR
     - The customer has an active, unexpired, non-revoked `sharing_grant` for that business.

4. **Financial Accuracy**:
   - All monetary figures are stored as integer minor units (e.g. cents/pence) with a 3-letter currency code (e.g. `USD`, `EUR`, `GBP`).
   - Calculations use round-half-up or explicit integer arithmetic to prevent floating-point inaccuracies.

5. **Conventional Deterministic Logic**:
   - No black-box machine learning or LLMs. Every state transition, audit event, and notification is governed by strict deterministic rules.
