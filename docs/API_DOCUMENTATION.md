# FixTrack REST API Documentation (/api/v1)

All endpoints accept and return JSON payloads (`application/json`). Protected routes require the `Authorization: Bearer <jwt_token>` header.

Interactive OpenAPI documentation is live at `/docs` (Swagger UI) and `/redoc`.

---

## 1. Authentication & Profiles (`/api/v1/auth`, `/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new Customer or Business Owner | Public |
| `POST` | `/api/v1/auth/login` | Authenticate with email/password; returns JWT | Public |
| `GET` | `/api/v1/auth/me` | Retrieve profile of the currently logged-in user | Authenticated |
| `POST` | `/api/v1/auth/logout` | Client sign-out confirmation | Authenticated |
| `GET` | `/api/v1/users/profile` | Retrieve personal user profile | Authenticated |
| `PUT` | `/api/v1/users/profile` | Update user name and phone | Authenticated |

---

## 2. Businesses & Staff Memberships (`/api/v1/businesses`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/businesses` | Register workshop business profile | Authenticated (Owner) |
| `GET` | `/api/v1/businesses/directory` | Public directory of certified repair workshops | Public |
| `GET` | `/api/v1/businesses/my` | Retrieve currently affiliated business profile | Authenticated |
| `GET` | `/api/v1/businesses/{id}` | Inspect specific business details | Public |
| `PUT` | `/api/v1/businesses/{id}` | Update business profile, address, categories | Business Owner / Admin |
| `POST` | `/api/v1/businesses/{id}/staff` | Invite/add technician or co-owner staff member | Business Owner / Admin |
| `GET` | `/api/v1/businesses/{id}/staff` | List staff members with roles and statuses | Business Staff / Admin |
| `PUT` | `/api/v1/businesses/{id}/staff/{m_id}` | Update staff member role or active status | Business Owner / Admin |

---

## 3. Asset Management (`/api/v1/assets`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/assets` | Register new item (phone, laptop, appliance, etc.) | Customer / Admin |
| `GET` | `/api/v1/assets` | List registered assets belonging to logged-in user | Customer / Admin |
| `GET` | `/api/v1/assets/{id}` | Get asset details (verifies owner or active grant) | Owner / Shop with grant |
| `PUT` | `/api/v1/assets/{id}` | Update asset attributes or custom metadata | Owner / Admin |

---

## 4. Repair Jobs & Lifecycle Transitions (`/api/v1/repair-jobs`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/repair-jobs` | Submit new repair request (supports repeat faults) | Customer |
| `GET` | `/api/v1/repair-jobs` | List user's or workshop's repair jobs with filters | Authenticated |
| `GET` | `/api/v1/repair-jobs/{id}` | Complete job details, timeline, and estimates | Authorized Customer / Shop |
| `POST` | `/api/v1/repair-jobs/{id}/transition` | Validate & execute status transition | Authorized Actor |
| `POST` | `/api/v1/repair-jobs/{id}/intake` | Document physical condition & accessories; check in | Business Staff |
| `POST` | `/api/v1/repair-jobs/{id}/diagnosis` | Record technical diagnostic inspection & findings | Business Staff |
| `POST` | `/api/v1/repair-jobs/{id}/complete-work` | Document work performed and replaced parts | Business Staff |
| `POST` | `/api/v1/repair-jobs/{id}/handover` | Record customer collection & sign-off | Business Staff |

---

## 5. Estimates & Approvals (`/api/v1/estimates`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/estimates/jobs/{job_id}` | Create immutable versioned estimate (v1, v2...) | Business Staff |
| `GET` | `/api/v1/estimates/jobs/{job_id}` | List all estimate versions for an audit trail | Authorized Customer / Shop |
| `POST` | `/api/v1/estimates/{id}/decide` | Customer decision (Approve, Reject, Request Changes)| Job Customer Owner |

---

## 6. Warranties (`/api/v1/warranties`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/warranties/jobs/{job_id}` | Issue warranty certificate with terms and duration | Business Staff |
| `GET` | `/api/v1/warranties` | List active & past warranties for user or shop | Authenticated |
| `GET` | `/api/v1/warranties/{id}` | View warranty certificate terms & limitations | Authorized Customer / Shop |
| `GET` | `/api/v1/warranties/check/asset/{asset_id}`| Lookup active warranty for an asset | Authenticated |

---

## 7. Customer-Controlled Repair Passports (`/api/v1/passports`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/passports/assets/{asset_id}` | Get authorized Repair Passport service ledger | Owner or Shop with active grant |

---

## 8. Sharing Grants (`/api/v1/sharing-grants`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/sharing-grants` | Create expiring sharing permission for a shop | Asset Owner |
| `POST` | `/api/v1/sharing-grants/{id}/revoke` | Immediately revoke active sharing permission | Asset Owner |
| `GET` | `/api/v1/sharing-grants/my-grants` | List customer's sharing permissions | Customer |
| `GET` | `/api/v1/sharing-grants/business/{id}`| List grants received by a repair shop | Business Staff |

---

## 9. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Get in-app notification center feed | Authenticated |
| `POST` | `/api/v1/notifications/{id}/read`| Mark notification as read | Authenticated |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all notifications read | Authenticated |

---

## 10. Platform Administration (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | List all accounts with status filters | Admin |
| `PUT` | `/api/v1/admin/users/{id}/status` | Suspend or restore user account with reason | Admin |
| `GET` | `/api/v1/admin/businesses` | List all businesses with verification status | Admin |
| `PUT` | `/api/v1/admin/businesses/{id}/verify`| Verify or revoke business verification | Admin |
| `GET` | `/api/v1/admin/audit-logs` | Inspect system-wide state change audit trail | Admin |
| `GET` | `/api/v1/admin/abuse-reports` | List and review abuse/moderation reports | Admin |
