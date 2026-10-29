def test_estimate_revision_and_prevent_stale_approval(client, customer_token, technician_token):
    # Customer registers an asset
    asset_res = client.post("/api/v1/assets", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "category": "home_appliances",
        "make": "Dyson",
        "model": "V15 Detect",
        "serial_number": "DY-V15-TEST"
    })
    asset_id = asset_res.json()["id"]

    biz_id = client.get("/api/v1/businesses/directory").json()[0]["id"]

    # Create job
    job = client.post("/api/v1/repair-jobs", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "asset_id": asset_id,
        "business_id": biz_id,
        "reported_issue": "Motor pulsates and stops after 3 seconds"
    }).json()
    job_id = job["id"]

    # Intake & diagnosis
    client.post(f"/api/v1/repair-jobs/{job_id}/intake", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "physical_condition": "Filter clogged, cyclone housing dirty"
    })
    client.post(f"/api/v1/repair-jobs/{job_id}/diagnosis", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "diagnosis_summary": "Failed cyclone motor PCB capacitor",
        "technical_findings": "Capacitor leaking. Requires motor PCB board."
    })

    # 1. Tech creates Estimate v1
    est_v1 = client.post(f"/api/v1/estimates/jobs/{job_id}", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "line_items": [
            {"description": "Main Cyclone Motor Body", "quantity": 1, "unit_price_minor": 15000, "item_type": "parts"},
            {"description": "Labor", "quantity": 1, "unit_price_minor": 5000, "item_type": "labor"}
        ]
    }).json()
    assert est_v1["version"] == 1

    # 2. Customer requests changes
    client.post(f"/api/v1/estimates/{est_v1['id']}/decide", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "decision": "request_changes",
        "notes": "Can we test if just replacing the filter and seal fixes it first?"
    })

    # 3. Tech creates revised Estimate v2
    est_v2 = client.post(f"/api/v1/estimates/jobs/{job_id}", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "line_items": [
            {"description": "HEPA Filter Assembly and Seal Kit", "quantity": 1, "unit_price_minor": 4500, "item_type": "parts"},
            {"description": "Deep Ultrasonic Cleaning & Labor", "quantity": 1, "unit_price_minor": 4000, "item_type": "labor"}
        ]
    }).json()
    assert est_v2["version"] == 2
    assert est_v2["status"] == "submitted"

    # 4. Attempting to approve stale Estimate v1 MUST be rejected!
    stale_attempt = client.post(f"/api/v1/estimates/{est_v1['id']}/decide", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "decision": "approve"
    })
    assert stale_attempt.status_code == 400
    assert "cannot be modified" in stale_attempt.json()["detail"].lower()

    # 5. Approving Estimate v2 succeeds
    good_approve = client.post(f"/api/v1/estimates/{est_v2['id']}/decide", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "decision": "approve"
    })
    assert good_approve.status_code == 200
    assert good_approve.json()["status"] == "approved"
