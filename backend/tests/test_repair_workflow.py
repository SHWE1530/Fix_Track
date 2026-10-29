def test_repair_workflow_and_state_transitions(client, customer_token, business_owner_token, technician_token):
    # 1. Customer creates an asset
    asset_res = client.post("/api/v1/assets", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "category": "smartphones_tablets",
        "make": "Google",
        "model": "Pixel 8 Pro",
        "year": 2023,
        "serial_number": "P8P-0011-TEST"
    })
    asset_id = asset_res.json()["id"]

    # Get business ID
    biz_res = client.get("/api/v1/businesses/directory")
    biz_id = biz_res.json()[0]["id"]

    # 2. Customer creates repair request
    job_res = client.post("/api/v1/repair-jobs", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "asset_id": asset_id,
        "business_id": biz_id,
        "reported_issue": "Broken rear camera glass and optical image stabilization buzzing"
    })
    assert job_res.status_code == 200
    job = job_res.json()
    job_id = job["id"]
    assert job["status"] == "REQUESTED"
    assert job["job_number"].startswith("FIX-")

    # 3. Invalid transition: cannot jump directly from REQUESTED to IN_PROGRESS
    inv_res = client.post(f"/api/v1/repair-jobs/{job_id}/transition", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "to_status": "IN_PROGRESS"
    })
    assert inv_res.status_code == 400
    assert "Invalid transition" in inv_res.json()["detail"]

    # 4. Technician checks in device & documents intake
    intake_res = client.post(f"/api/v1/repair-jobs/{job_id}/intake", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "physical_condition": "Cracked camera visor, screen in mint condition",
        "accessories_included": "Silicone protective case"
    })
    assert intake_res.status_code == 200
    assert intake_res.json()["status"] == "CHECKED_IN"

    # 5. Technician records diagnosis
    diag_res = client.post(f"/api/v1/repair-jobs/{job_id}/diagnosis", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "diagnosis_summary": "Cracked outer periscope glass and jammed autofocus magnetic coil",
        "technical_findings": "Sensor module requires replacement; laser autofocus sensor undamaged",
        "diagnostic_fee_minor": 3000
    })
    assert diag_res.status_code == 200
    assert diag_res.json()["status"] == "DIAGNOSING"

    # 6. Attempting to start repair work without estimate must fail
    fail_prog = client.post(f"/api/v1/repair-jobs/{job_id}/transition", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "to_status": "IN_PROGRESS"
    })
    assert fail_prog.status_code == 400

    # 7. Technician creates estimate (automatically transitions to AWAITING_APPROVAL)
    est_res = client.post(f"/api/v1/estimates/jobs/{job_id}", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "line_items": [
            {"description": "OEM Triple Camera Module Assembly", "quantity": 1, "unit_price_minor": 12000, "item_type": "parts"},
            {"description": "Micro Precision Assembly Labor", "quantity": 1, "unit_price_minor": 4500, "item_type": "labor"}
        ],
        "currency": "USD",
        "tax_rate_percent": 8.0,
        "notes": "Original Google camera parts."
    })
    assert est_res.status_code == 200
    est = est_res.json()
    assert est["version"] == 1
    assert est["status"] == "submitted"
    assert est["total_minor"] == 17820 # (16500 + 1320 tax)

    # Job status is now AWAITING_APPROVAL
    get_job = client.get(f"/api/v1/repair-jobs/{job_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert get_job.json()["status"] == "AWAITING_APPROVAL"

    # 8. Customer approves estimate (automatically transitions job to APPROVED)
    decide_res = client.post(f"/api/v1/estimates/{est['id']}/decide", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "decision": "approve",
        "notes": "Looks good, please proceed with OEM parts"
    })
    assert decide_res.status_code == 200
    assert decide_res.json()["status"] == "approved"

    get_job2 = client.get(f"/api/v1/repair-jobs/{job_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert get_job2.json()["status"] == "APPROVED"

    # 9. Technician moves job to IN_PROGRESS (now succeeds because estimate is approved!)
    prog_res = client.post(f"/api/v1/repair-jobs/{job_id}/transition", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "to_status": "IN_PROGRESS"
    })
    assert prog_res.status_code == 200
    assert prog_res.json()["status"] == "IN_PROGRESS"

    # 10. Technician marks work completed (moves to READY_FOR_COLLECTION)
    comp_res = client.post(f"/api/v1/repair-jobs/{job_id}/complete-work", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "work_performed": "Installed new OEM camera module and tested optical zoom and autofocus across all focal lengths",
        "parts_replaced": ["OEM Triple Camera Module Assembly"]
    })
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "READY_FOR_COLLECTION"

    # 11. Customer collects device (moves to COLLECTED)
    hand_res = client.post(f"/api/v1/repair-jobs/{job_id}/handover", headers={"Authorization": f"Bearer {technician_token}"}, json={
        "collected_by_name": "Test Customer",
        "confirmation_notes": "Tested in shop, cameras working perfectly"
    })
    assert hand_res.status_code == 200
    assert hand_res.json()["status"] == "COLLECTED"

    # 12. Final archiving to CLOSED
    close_res = client.post(f"/api/v1/repair-jobs/{job_id}/transition", headers={"Authorization": f"Bearer {business_owner_token}"}, json={
        "to_status": "CLOSED"
    })
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "CLOSED"
