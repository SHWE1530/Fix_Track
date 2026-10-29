# FixTrack Repair Workflow & State Machine

## 1. Workflow States

The FixTrack platform enforces 11 discrete states for every repair job:

| State | Description | Initiator / Actor |
|---|---|---|
| `REQUESTED` | Repair request submitted by customer; awaiting shop check-in | Customer |
| `CHECKED_IN` | Item physically or formally received by shop; intake condition documented | Business (Owner/Tech) |
| `DIAGNOSING` | Technician inspecting, testing, and troubleshooting the fault | Business (Owner/Tech) |
| `AWAITING_APPROVAL` | Estimate submitted to customer; awaiting customer decision | Business (Owner/Tech) |
| `APPROVED` | Customer approved the active estimate version | Customer |
| `IN_PROGRESS` | Active repair work / disassembly / parts replacement underway | Business (Owner/Tech) |
| `ON_HOLD` | Temporarily paused (e.g., parts on order, waiting for customer response) | Business (Owner/Tech) |
| `READY_FOR_COLLECTION` | Work completed, tested, cleaned, and staged for handover | Business (Owner/Tech) |
| `COLLECTED` | Item handed back to customer, signed off, warranty generated | Business (Owner/Tech) |
| `CLOSED` | Job completed, archived, all terms fulfilled | Business or Admin |
| `CANCELLED` | Job cancelled prior to completion with recorded reason | Customer or Business |

## 2. Transition Matrix

The table below indicates the allowable next states for any current state:

| Current State | Allowed Next States | Conditions / Rules |
|---|---|---|
| `REQUESTED` | `CHECKED_IN`, `CANCELLED` | Shop checks in device or either party cancels before check-in |
| `CHECKED_IN` | `DIAGNOSING`, `AWAITING_APPROVAL`, `CANCELLED` | Tech starts diagnosis or submits immediate estimate |
| `DIAGNOSING` | `AWAITING_APPROVAL`, `ON_HOLD`, `CANCELLED` | Tech finishes diagnosis and prepares estimate, or parts needed for test |
| `AWAITING_APPROVAL` | `APPROVED`, `DIAGNOSING`, `CANCELLED` | Customer approves; customer requests changes (returns to DIAGNOSING for revised estimate); or customer rejects & cancels |
| `APPROVED` | `IN_PROGRESS`, `ON_HOLD`, `CANCELLED` | Tech begins approved repair work |
| `IN_PROGRESS` | `READY_FOR_COLLECTION`, `ON_HOLD`, `AWAITING_APPROVAL`, `CANCELLED` | Completion; paused; or unexpected fault requiring revised estimate |
| `ON_HOLD` | `DIAGNOSING`, `IN_PROGRESS`, `AWAITING_APPROVAL`, `CANCELLED` | Resumed once parts arrive or blocker resolved |
| `READY_FOR_COLLECTION`| `COLLECTED`, `IN_PROGRESS` | Customer collects item, or re-testing reveals remaining issue |
| `COLLECTED` | `CLOSED` | Final archiving and sign-off |
| `CLOSED` | None (Final) | Terminal state (repeat faults open a new linked job) |
| `CANCELLED` | None (Final) | Terminal state with reason recorded |

## 3. Strict Rules & Constraints

1. **Pre-Repair Approval Gate**:
   - Repair work requiring customer expenditure cannot transition to `IN_PROGRESS` unless the job is in `APPROVED` status with an approved estimate version.
   - Diagnostic work is allowed in `CHECKED_IN` and `DIAGNOSING` prior to estimate creation, but physical replacement of parts or billable repair work is barred until customer approval.

2. **Estimate Revision Protocol**:
   - When a customer requests changes or rejects an estimate, or if a technician discovers additional defects during `IN_PROGRESS`, a new estimate version must be created.
   - The previous estimate version remains permanently frozen.
   - The job returns to `AWAITING_APPROVAL` and work cannot proceed until the customer approves the new version.

3. **Repeat-Fault Linking**:
   - If an asset experiences the same issue after collection, the customer or business creates a new repair request with `repeat_fault_of_job_id` referencing the earlier job.
   - The backend validates that the earlier job belongs to the same asset and is in `COLLECTED` or `CLOSED` state.
   - The previous warranty record is automatically linked and displayed to both technician and customer for warranty claim evaluation.

4. **Job Event Audit Trail**:
   - Every state transition generates an immutable `job_events` record capturing:
     - `job_id`
     - `actor_id`
     - `actor_role`
     - `from_status`
     - `to_status`
     - `reason` (mandatory for CANCELLED and ON_HOLD)
     - `created_at` (UTC)
