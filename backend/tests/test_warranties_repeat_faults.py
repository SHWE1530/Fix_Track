def test_warranty_issuance_and_terms(client, technician_token, customer_token):
    # Retrieve existing seed collected job
    jobs = client.get("/api/v1/repair-jobs", headers={"Authorization": f"Bearer {customer_token}"}).json()
    collected_job = next(j for j in jobs if j["status"] == "COLLECTED")
    job_id = collected_job["id"]

    # Warranty already issued during seed, check warranty details
    w_res = client.get("/api/v1/warranties", headers={"Authorization": f"Bearer {customer_token}"})
    assert w_res.status_code == 200
    warranties = w_res.json()
    assert len(warranties) >= 1
    w = warranties[0]
    assert w["warranty_number"].startswith("WAR-")
    assert w["is_active"] is True
    assert "covered_terms" in w

def test_repeat_fault_linking(client, customer_token, technician_token):
    # Customer Alice has ThinkPad X1 with earlier collected repair job
    jobs = client.get("/api/v1/repair-jobs", headers={"Authorization": f"Bearer {customer_token}"}).json()
    earlier_job = next(j for j in jobs if j["status"] == "COLLECTED")

    biz_id = earlier_job["business_id"]
    asset_id = earlier_job["asset_id"]

    # Customer files a new repair request linked as a repeat fault
    repeat_job_res = client.post("/api/v1/repair-jobs", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "asset_id": asset_id,
        "business_id": biz_id,
        "reported_issue": "Display flickering has returned on bottom corner",
        "repeat_fault_of_job_id": earlier_job["id"]
    })
    assert repeat_job_res.status_code == 200
    rep_job = repeat_job_res.json()
    assert rep_job["repeat_fault_of_job_id"] == earlier_job["id"]
    assert rep_job["repeat_fault_job_number"] == earlier_job["job_number"]

    # Technician views the new job and sees active warranty and linked repeat fault
    view_res = client.get(f"/api/v1/repair-jobs/{rep_job['id']}", headers={"Authorization": f"Bearer {technician_token}"})
    assert view_res.status_code == 200
    assert view_res.json()["repeat_fault_job_number"] == earlier_job["job_number"]
