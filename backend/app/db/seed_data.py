import logging
from datetime import datetime, timedelta, timezone
from app.core.security import hash_password
from app.db.mongodb import get_db
from app.models.enums import AssetCategory, EstimateStatus, JobStatus, MembershipRole, MembershipStatus, UserRole, WarrantyStatus
from app.utils.identifiers import generate_reference, generate_token

logger = logging.getLogger("fixtrack.seed")

def seed_initial_data(db=None):
    if db is None:
        db = get_db()

    # Check if admin already exists
    if db.users.find_one({"email": "admin@fixtrack.com"}):
        logger.info("Seed data already present. Skipping.")
        return

    logger.info("Seeding initial FixTrack demonstration data...")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 1. Admin
    admin_res = db.users.insert_one({
        "email": "admin@fixtrack.com",
        "password_hash": hash_password("AdminPass123!"),
        "full_name": "Platform Administrator",
        "phone": "+1 (555) 010-0001",
        "role": UserRole.ADMIN.value,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    admin_id = str(admin_res.inserted_id)

    # 2. Business Owner (Apex Tech Solutions)
    owner_res = db.users.insert_one({
        "email": "owner@apexrepair.com",
        "password_hash": hash_password("OwnerPass123!"),
        "full_name": "Marcus Vance",
        "phone": "+1 (555) 010-0002",
        "role": UserRole.BUSINESS_OWNER.value,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    owner_id = str(owner_res.inserted_id)

    # 3. Technician
    tech_res = db.users.insert_one({
        "email": "tech@apexrepair.com",
        "password_hash": hash_password("TechPass123!"),
        "full_name": "Elena Rostova",
        "phone": "+1 (555) 010-0003",
        "role": UserRole.TECHNICIAN.value,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    tech_id = str(tech_res.inserted_id)

    # 4. Customer Alice Morgan
    cust_res = db.users.insert_one({
        "email": "customer@example.com",
        "password_hash": hash_password("CustomerPass123!"),
        "full_name": "Alice Morgan",
        "phone": "+1 (555) 010-0004",
        "role": UserRole.CUSTOMER.value,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    cust_id = str(cust_res.inserted_id)

    # 5. Customer David Kim
    cust2_res = db.users.insert_one({
        "email": "david@example.com",
        "password_hash": hash_password("CustomerPass123!"),
        "full_name": "David Kim",
        "phone": "+1 (555) 010-0005",
        "role": UserRole.CUSTOMER.value,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    cust2_id = str(cust2_res.inserted_id)

    # 6. Businesses
    biz_res = db.businesses.insert_one({
        "owner_id": owner_id,
        "name": "Apex Tech Solutions",
        "legal_name": "Apex Precision Electronics LLC",
        "email": "service@apexrepair.com",
        "phone": "+1 (555) 789-4321",
        "address": "742 Evergreen Terrace, Suite 101, Springfield, OR",
        "website": "https://apextechrepair.example.com",
        "description": "Certified micro-soldering, component-level motherboard diagnostics, and consumer electronics repair center.",
        "supported_categories": [
            AssetCategory.SMARTPHONES_TABLETS.value,
            AssetCategory.LAPTOPS_COMPUTERS.value,
            AssetCategory.HOME_APPLIANCES.value
        ],
        "is_verified": True,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    biz_id = str(biz_res.inserted_id)

    biz2_res = db.businesses.insert_one({
        "owner_id": admin_id,
        "name": "Velocity Bike & Precision Motors",
        "legal_name": "Velocity Mechanics Co",
        "email": "contact@velocitymechanics.example.com",
        "phone": "+1 (555) 432-8765",
        "address": "1204 Industrial Boulevard, Portland, OR",
        "website": "https://velocitymechanics.example.com",
        "description": "Comprehensive bicycle servicing, e-bike troubleshooting, and motorcycle tune-ups.",
        "supported_categories": [
            AssetCategory.BICYCLES.value,
            AssetCategory.CARS_MOTORCYCLES.value
        ],
        "is_verified": True,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    biz2_id = str(biz2_res.inserted_id)

    # Memberships
    db.memberships.insert_one({
        "business_id": biz_id,
        "user_id": owner_id,
        "user_email": "owner@apexrepair.com",
        "user_name": "Marcus Vance",
        "role": MembershipRole.OWNER.value,
        "status": MembershipStatus.ACTIVE.value,
        "created_at": now_iso,
        "updated_at": now_iso
    })
    db.memberships.insert_one({
        "business_id": biz_id,
        "user_id": tech_id,
        "user_email": "tech@apexrepair.com",
        "user_name": "Elena Rostova",
        "role": MembershipRole.TECHNICIAN.value,
        "status": MembershipStatus.ACTIVE.value,
        "created_at": now_iso,
        "updated_at": now_iso
    })

    # Assets
    asset1_res = db.assets.insert_one({
        "owner_id": cust_id,
        "category": AssetCategory.SMARTPHONES_TABLETS.value,
        "make": "Apple",
        "model": "iPhone 15 Pro",
        "year": 2023,
        "serial_number": "DNPZ8942KLM1",
        "color": "Natural Titanium",
        "notes": "Purchased in September 2023, pristine condition",
        "metadata": {"storage_gb": 256, "battery_health": 82},
        "created_at": now_iso,
        "updated_at": now_iso
    })
    asset1_id = str(asset1_res.inserted_id)

    asset2_res = db.assets.insert_one({
        "owner_id": cust_id,
        "category": AssetCategory.LAPTOPS_COMPUTERS.value,
        "make": "Lenovo",
        "model": "ThinkPad X1 Carbon Gen 10",
        "year": 2022,
        "serial_number": "PF39KX1004",
        "color": "Deep Black",
        "notes": "Workstation laptop with dual USB-C Thunderbolt ports",
        "metadata": {"ram_gb": 32, "cpu": "Intel Core i7-1260P"},
        "created_at": now_iso,
        "updated_at": now_iso
    })
    asset2_id = str(asset2_res.inserted_id)

    asset3_res = db.assets.insert_one({
        "owner_id": cust2_id,
        "category": AssetCategory.HOME_APPLIANCES.value,
        "make": "Bosch",
        "model": "Serie 6 Front Loader Washing Machine",
        "year": 2021,
        "serial_number": "WAT28400UC-01",
        "color": "White",
        "notes": "Drum bearing making grinding noise during spin cycle",
        "metadata": {"capacity_kg": 9, "installation_type": "Freestanding"},
        "created_at": now_iso,
        "updated_at": now_iso
    })
    asset3_id = str(asset3_res.inserted_id)

    # Job 1: ThinkPad X1 (COLLECTED with 90-day warranty)
    two_weeks_ago = (now - timedelta(days=14)).isoformat()
    job1_num = generate_reference(prefix="FIX")
    job1_res = db.repair_jobs.insert_one({
        "job_number": job1_num,
        "asset_id": asset2_id,
        "customer_id": cust_id,
        "business_id": biz_id,
        "status": JobStatus.COLLECTED.value,
        "reported_issue": "Intermittent display flickering and line artifact across bottom edge of OLED panel.",
        "customer_notes": "Started after a business flight. No external drop damage.",
        "physical_condition": "Minor scuffs on outer magnesium chassis. Display glass free of cracks.",
        "accessories_included": "65W USB-C OEM AC adapter and padded sleeve",
        "checked_in_at": two_weeks_ago,
        "diagnosis_summary": "Faulty eDP display ribbon flex cable and micro-fracture along lower OLED matrix connector.",
        "technical_findings": "Signal degradation observed on high refresh rate. Display replacement required.",
        "diagnostic_fee_minor": 4500,
        "diagnosed_at": two_weeks_ago,
        "work_performed": "Replaced internal eDP display ribbon cable and installed genuine factory calibrated 2.8K OLED display assembly. Recalibrated color profile and ran 4-hour thermal/stress diagnostic cycle.",
        "parts_replaced": ["OEM 14-inch 2.8K OLED Panel Assembly", "High-frequency eDP 40-pin display harness"],
        "completed_at": (now - timedelta(days=5)).isoformat(),
        "collected_at": (now - timedelta(days=3)).isoformat(),
        "collected_by_name": "Alice Morgan",
        "created_at": two_weeks_ago,
        "updated_at": (now - timedelta(days=3)).isoformat()
    })
    job1_id = str(job1_res.inserted_id)

    # Estimate for Job 1 (Approved)
    db.estimates.insert_one({
        "job_id": job1_id,
        "version": 1,
        "status": EstimateStatus.APPROVED.value,
        "line_items": [
            {"description": "OEM 14-inch 2.8K OLED Display Panel", "quantity": 1, "unit_price_minor": 24000, "total_minor": 24000, "item_type": "parts"},
            {"description": "Replacement eDP Display Flex Harness", "quantity": 1, "unit_price_minor": 2800, "total_minor": 2800, "item_type": "parts"},
            {"description": "Precision Micro-Disassembly & Panel Calibration Labor", "quantity": 2, "unit_price_minor": 6500, "total_minor": 13000, "item_type": "labor"}
        ],
        "subtotal_minor": 39800,
        "tax_minor": 3184,
        "total_minor": 42984,
        "currency": "USD",
        "notes": "Includes 90-day parts and labor coverage against manufacturing defects.",
        "created_by_user_id": tech_id,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": two_weeks_ago,
        "decided_at": (now - timedelta(days=12)).isoformat(),
        "decision_notes": "Approved by Alice Morgan"
    })

    # Warranty for Job 1
    war_num = generate_reference(prefix="WAR")
    db.warranties.insert_one({
        "warranty_number": war_num,
        "job_id": job1_id,
        "asset_id": asset2_id,
        "customer_id": cust_id,
        "business_id": biz_id,
        "business_name": "Apex Tech Solutions",
        "start_date": (now - timedelta(days=3)).isoformat(),
        "end_date": (now + timedelta(days=87)).isoformat(),
        "duration_days": 90,
        "covered_terms": "Full coverage for display anomalies, backlight failure, and assembly defects on replaced OLED screen.",
        "limitations": "Excludes accidental drops, liquid submersion, and third-party tampering.",
        "status": WarrantyStatus.ACTIVE.value,
        "created_at": (now - timedelta(days=3)).isoformat(),
        "updated_at": (now - timedelta(days=3)).isoformat()
    })

    # Job 2: iPhone 15 Pro (IN_PROGRESS)
    job2_num = generate_reference(prefix="FIX")
    job2_res = db.repair_jobs.insert_one({
        "job_number": job2_num,
        "asset_id": asset1_id,
        "customer_id": cust_id,
        "business_id": biz_id,
        "status": JobStatus.IN_PROGRESS.value,
        "reported_issue": "Rapid battery drain (shuts down unexpectedly at 25%) and swollen rear glass seam.",
        "customer_notes": "Device gets hot when connected to fast charger.",
        "physical_condition": "Rear glass slightly lifted on left bezel due to battery expansion. Display intact.",
        "accessories_included": "Silicone bumper case",
        "checked_in_at": (now - timedelta(days=2)).isoformat(),
        "diagnosis_summary": "Chemical battery degradation with slight cell expansion. Battery health 74% cycle count 840.",
        "technical_findings": "Power management IC functioning normally. Safe enclosure replacement and new OEM adhesive seal required.",
        "diagnostic_fee_minor": 2500,
        "diagnosed_at": (now - timedelta(days=1)).isoformat(),
        "created_at": (now - timedelta(days=2)).isoformat(),
        "updated_at": now_iso
    })
    job2_id = str(job2_res.inserted_id)

    # Approved estimate for Job 2
    db.estimates.insert_one({
        "job_id": job2_id,
        "version": 1,
        "status": EstimateStatus.APPROVED.value,
        "line_items": [
            {"description": "Genuine High-Density Lithium-Ion Battery Pack", "quantity": 1, "unit_price_minor": 8900, "total_minor": 8900, "item_type": "parts"},
            {"description": "Laser-cut IP68 Waterproof Dust Seal Gasket", "quantity": 1, "unit_price_minor": 1200, "total_minor": 1200, "item_type": "parts"},
            {"description": "Specialized Battery Extraction and Cleanroom Assembly", "quantity": 1, "unit_price_minor": 4500, "total_minor": 4500, "item_type": "labor"}
        ],
        "subtotal_minor": 14600,
        "tax_minor": 1168,
        "total_minor": 15768,
        "currency": "USD",
        "notes": "Battery serial number paired via official diagnostic software.",
        "created_by_user_id": tech_id,
        "expires_at": (now + timedelta(days=14)).isoformat(),
        "created_at": (now - timedelta(days=1)).isoformat(),
        "decided_at": now_iso,
        "decision_notes": "Approved by Alice Morgan"
    })

    # Job 3: Bosch Washing Machine (AWAITING_APPROVAL)
    job3_num = generate_reference(prefix="FIX")
    job3_res = db.repair_jobs.insert_one({
        "job_number": job3_num,
        "asset_id": asset3_id,
        "customer_id": cust2_id,
        "business_id": biz_id,
        "status": JobStatus.AWAITING_APPROVAL.value,
        "reported_issue": "Excessive vibration and loud metallic scraping noise during high-speed 1200 RPM spin.",
        "customer_notes": "Happens even with empty drum.",
        "physical_condition": "Standard utility room exterior wear.",
        "accessories_included": "None",
        "checked_in_at": (now - timedelta(days=1)).isoformat(),
        "diagnosis_summary": "Worn inner tub spider bracket bearings and failed shock absorber dampeners.",
        "technical_findings": "Bearing seal broke allowing water into outer race. Requires bearing kit and twin shock dampers.",
        "diagnostic_fee_minor": 6000,
        "diagnosed_at": now_iso,
        "created_at": (now - timedelta(days=1)).isoformat(),
        "updated_at": now_iso
    })
    job3_id = str(job3_res.inserted_id)

    # Estimate for Job 3 (Submitted)
    db.estimates.insert_one({
        "job_id": job3_id,
        "version": 1,
        "status": EstimateStatus.SUBMITTED.value,
        "line_items": [
            {"description": "Heavy-Duty Tub Spider Bearing & Water Seal Assembly", "quantity": 1, "unit_price_minor": 11500, "total_minor": 11500, "item_type": "parts"},
            {"description": "Heavy-Duty Friction Strut Dampers (Pair)", "quantity": 1, "unit_price_minor": 4800, "total_minor": 4800, "item_type": "parts"},
            {"description": "Drum Teardown, Shaft Machining & Balance Test Labor", "quantity": 3, "unit_price_minor": 5500, "total_minor": 16500, "item_type": "labor"}
        ],
        "subtotal_minor": 32800,
        "tax_minor": 2624,
        "total_minor": 35424,
        "currency": "USD",
        "notes": "Includes 180-day guarantee on motor alignment and seal integrity.",
        "created_by_user_id": tech_id,
        "expires_at": (now + timedelta(days=14)).isoformat(),
        "created_at": now_iso
    })

    # 7. Customer Sharing Grant: Alice shares ThinkPad X1 passport with Apex Tech Solutions
    db.sharing_grants.insert_one({
        "asset_id": asset2_id,
        "owner_id": cust_id,
        "target_business_id": biz_id,
        "target_business_name": "Apex Tech Solutions",
        "selected_job_ids": None, # All records
        "expires_at": (now + timedelta(days=60)).isoformat(),
        "status": "active",
        "notes": "Shared for warranty and subsequent tune-up inspection.",
        "token": generate_token(32),
        "created_at": now_iso,
        "updated_at": now_iso
    })

    logger.info("Demo data seed complete! Admin, business, customers, assets, jobs, estimates, warranties, and sharing grants generated.")

if __name__ == "__main__":
    seed_initial_data()
