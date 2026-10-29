# FixTrack — Cross-Service Repair Transparency Platform

FixTrack is a production-ready, full-stack repair transparency and service-history platform connecting consumers with independent repair businesses.

It features a **customer-controlled, portable Repair Passport** across participating repair providers, itemized immutable estimate versioning, strict backend-enforced state transitions, and verifiable warranty management.

---

## 1. Final Monorepo Structure

```
FixTrack/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── admin.py
│   │   │       ├── assets.py
│   │   │       ├── attachments.py
│   │   │       ├── auth.py
│   │   │       ├── businesses.py
│   │   │       ├── estimates.py
│   │   │       ├── notifications.py
│   │   │       ├── passports.py
│   │   │       ├── repair_jobs.py
│   │   │       ├── sharing.py
│   │   │       ├── users.py
│   │   │       └── warranties.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   ├── rate_limiter.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── init_indexes.py
│   │   │   ├── mongodb.py
│   │   │   └── seed_data.py
│   │   ├── models/
│   │   │   └── enums.py
│   │   ├── schemas/
│   │   │   ├── asset.py
│   │   │   ├── attachment.py
│   │   │   ├── audit.py
│   │   │   ├── auth.py
│   │   │   ├── business.py
│   │   │   ├── estimate.py
│   │   │   ├── notification.py
│   │   │   ├── repair_job.py
│   │   │   ├── sharing.py
│   │   │   ├── user.py
│   │   │   └── warranty.py
│   │   ├── services/
│   │   │   ├── asset_service.py
│   │   │   ├── audit_service.py
│   │   │   ├── auth_service.py
│   │   │   ├── business_service.py
│   │   │   ├── estimate_service.py
│   │   │   ├── file_service.py
│   │   │   ├── job_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── passport_service.py
│   │   │   ├── sharing_service.py
│   │   │   └── warranty_service.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_admin_audit.py
│   │   ├── test_assets.py
│   │   ├── test_auth.py
│   │   ├── test_estimates.py
│   │   ├── test_repair_workflow.py
│   │   ├── test_sharing_passports.py
│   │   └── test_warranties_repeat_faults.py
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── CategoryIcon.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── Timeline.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx
│   │   │   ├── business/
│   │   │   │   ├── BusinessDashboard.jsx
│   │   │   │   ├── BusinessJobDetailPage.jsx
│   │   │   │   ├── BusinessProfilePage.jsx
│   │   │   │   └── StaffManagementPage.jsx
│   │   │   ├── customer/
│   │   │   │   ├── AccountSettingsPage.jsx
│   │   │   │   ├── AddAssetPage.jsx
│   │   │   │   ├── CustomerDashboard.jsx
│   │   │   │   ├── MyAssetsPage.jsx
│   │   │   │   ├── MyRepairJobsPage.jsx
│   │   │   │   ├── NewRepairRequestPage.jsx
│   │   │   │   ├── RepairJobDetailPage.jsx
│   │   │   │   ├── RepairPassportPage.jsx
│   │   │   │   ├── SharingGrantsPage.jsx
│   │   │   │   └── WarrantiesPage.jsx
│   │   │   └── public/
│   │   │       ├── BusinessDirectoryPage.jsx
│   │   │       ├── CategoriesPage.jsx
│   │   │       ├── HowItWorksPage.jsx
│   │   │       ├── LandingPage.jsx
│   │   │       ├── LoginPage.jsx
│   │   │       └── RegisterPage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── REPAIR_WORKFLOW.md
│   └── SETUP.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 2. Implemented Features (End-to-End)

1. **Authentication & Authorization**:
   - Secure salted bcrypt rounds and stateless JWT access tokens.
   - Distinct roles: `Customer`, `Business Owner`, `Technician`, and `Platform Administrator`.
   - In-memory sliding window rate limiting on authentication routes.
   - Password hashes are automatically stripped from all serialized output.

2. **Configurable Repair Category System**:
   - Configurable categories: Smartphones & tablets, Laptops & computers, Home appliances, Bicycles, Cars & motorcycles, Furniture, and Other repairable items.
   - Common asset attributes (make, model, year, serial identifier) with dynamic, category-specific metadata.

3. **Backend-Enforced Repair State Machine**:
   - 11 discrete states: `REQUESTED`, `CHECKED_IN`, `DIAGNOSING`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `ON_HOLD`, `READY_FOR_COLLECTION`, `COLLECTED`, `CLOSED`, `CANCELLED`.
   - Transition matrix strictly checked server-side.
   - **No Work Without Approval Gate**: Moving to `IN_PROGRESS` strictly requires an approved estimate.
   - Mandated reasons for `ON_HOLD` and `CANCELLED`.
   - Immutable `job_events` record generated for every transition with actor, timestamp, and reason.

4. **Immutable Versioned Itemized Estimates**:
   - Money stored as integer minor units (cents) with 3-letter currency code (`USD`).
   - Line items with quantity, unit price, and item types (parts, labor, diagnostic, fee).
   - Once submitted, version is frozen; customer can Approve, Reject, or Request Changes.
   - Preventing approval of stale versions: Revisions generate v2, v3 and obsolete older drafts.

5. **Customer-Controlled Portable Repair Passport**:
   - Chronological ledger of all authenticated repairs for an asset.
   - Displays repairing shop, service date, reported issue, diagnosis, approved estimate summary, work performed, replaced parts, warranty details, and customer attachments.
   - Private internal technician notes are systematically excluded.
   - **Granular Sharing Grants**: Customers grant expiring, revocable permissions to selected workshops. Server validates ownership or active grant on every request.

6. **Verifiable Warranties & Repeat-Fault Linking**:
   - Warranty records with duration days, start/end dates, terms, and exclusions issued upon handover.
   - Repeat fault linking connects recurring issues directly to previous jobs and active warranties.

7. **In-App Notification Center**:
   - Polled notification feed informing customers and staff of status changes, submitted estimates, customer approvals, and warranty issuances.

8. **Platform Administration**:
   - Account moderation (suspend/restore with reason).
   - Workshop verification management.
   - Platform audit log inspection.
   - Customer document privacy guarantee enforced.

---

## 3. Database Collections & Indexes

| Collection | Purpose | Primary Indexes |
|---|---|---|
| `users` | User accounts & credentials | `email` (unique), `role`, `created_at` |
| `businesses` | Repair shop profiles & categories | `owner_id`, `is_verified`, `categories` |
| `memberships` | Staff roles (Owner / Technician) | `(business_id, user_id)` (unique) |
| `assets` | Registered devices & appliances | `owner_id`, `category`, `serial_number` |
| `repair_jobs` | Lifecycle service jobs | `job_number` (unique), `asset_id`, `customer_id`, `business_id`, `status` |
| `estimates` | Versioned itemized estimates | `(job_id, version)` (unique), `status` |
| `job_events` | Granular transition audit trail | `(job_id, created_at)` |
| `warranties` | Service warranty certificates | `warranty_number` (unique), `job_id`, `asset_id`, `end_date` |
| `attachments` | Authorized photos & documents | `job_id`, `asset_id`, `uploaded_by` |
| `sharing_grants` | Granular shop access permissions | `asset_id`, `target_business_id`, `status`, `expires_at` |
| `notifications` | In-app alerts | `(user_id, is_read)`, `created_at` |
| `audit_logs` | Platform audit events | `action`, `user_id`, `created_at` |

---

## 4. Quick Start & Setup Instructions

### Option A: Local Development (Windows / macOS / Linux)

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (automated in-memory mock MongoDB active if local server not running)
python -m uvicorn app.main:app --reload --port 8000
```
- API is available at: `http://localhost:8000/api/v1`
- Swagger UI docs: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application is available at: `http://localhost:5173`

---

### Option B: Docker Compose

```bash
docker-compose up --build
```
This launches:
- `mongodb` on port `27017`
- `fixtrack-backend` on port `8000`
- `fixtrack-frontend` on port `5173`

---

## 5. Pre-Seeded Interactive Demonstration Accounts

The platform automatically seeds realistic demonstration data on first launch:

| Role | Name | Email | Password |
|---|---|---|---|
| **Customer** | Alice Morgan | `customer@example.com` | `CustomerPass123!` |
| **Customer 2** | David Kim | `david@example.com` | `CustomerPass123!` |
| **Shop Owner** | Marcus Vance | `owner@apexrepair.com` | `OwnerPass123!` |
| **Technician** | Elena Rostova | `tech@apexrepair.com` | `TechPass123!` |
| **Administrator** | Platform Admin | `admin@fixtrack.com` | `AdminPass123!` |

The login page includes **1-click quick fill buttons** for each of these test profiles.

---

## 6. Test Suite Execution & Results

Run the backend test suite:
```bash
cd backend
pytest tests/ -v
```

### Verified Test Results:
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.3.4, pluggy-1.6.0
rootdir: C:\Users\asus\Desktop\FixTrack\backend
configfile: pytest.ini

tests/test_admin_audit.py::test_admin_rbac_and_audit PASSED              [  8%]
tests/test_assets.py::test_asset_crud_and_ownership PASSED               [ 16%]
tests/test_auth.py::test_registration_success PASSED                     [ 25%]
tests/test_auth.py::test_registration_duplicate_email PASSED             [ 33%]
tests/test_auth.py::test_login_invalid_credentials PASSED                [ 41%]
tests/test_auth.py::test_current_user_profile PASSED                     [ 50%]
tests/test_auth.py::test_unauthenticated_request_rejected PASSED         [ 58%]
tests/test_estimates.py::test_estimate_revision_and_prevent_stale_approval PASSED [ 66%]
tests/test_repair_workflow.py::test_repair_workflow_and_state_transitions PASSED [ 75%]
tests/test_sharing_passports.py::test_passport_and_sharing_permissions PASSED [ 83%]
tests/test_warranties_repeat_faults.py::test_warranty_issuance_and_terms PASSED [ 91%]
tests/test_warranties_repeat_faults.py::test_repeat_fault_linking PASSED [100%]

============================= 12 passed in 52.18s =============================
```

Frontend bundle validation:
```bash
cd frontend
npm run build
# Built in 2.99s with 0 errors
```

---

## 7. Known Limitations & Recommended Next Steps

### Known MVP Scope Limitations
1. **No Online Payment Processing**: Intentionally out of MVP scope; invoices and minor-unit estimate totals reflect authorized costs without payment gateway hooks.
2. **Local File Storage**: Attachment uploads currently store to the local filesystem (`./uploads`). For production cloud scaling, an S3/GCS adapter interface is recommended.
3. **In-App Polling Notifications**: Notifications poll the server on a 30-second interval rather than WebSockets.

### Recommended Next Steps for Real-World User Validation
1. **Pilot with 3 Independent Workshops**: Validate whether technicians find documenting intake conditions (photos + checkboxes) fast enough during busy front-counter check-in.
2. **Customer Estimate Approval Friction Testing**: Measure customer conversion time between receiving `AWAITING_APPROVAL` alerts and providing sign-off via phone/tablet.
3. **Repair Passport Transferability Field Trial**: Test second-hand asset transfers where a customer sells an item (e.g., bicycle or laptop) and transfers passport ownership to the new buyer.
