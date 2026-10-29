def test_passport_and_sharing_permissions(client, customer_token, customer2_token, technician_token, business_owner_token):
    # Customer Alice owns ThinkPad X1
    assets = client.get("/api/v1/assets", headers={"Authorization": f"Bearer {customer_token}"}).json()
    thinkpad = next(a for a in assets if "ThinkPad" in a["model"])
    thinkpad_id = thinkpad["id"]

    # 1. Customer can view their own Repair Passport
    p_res = client.get(f"/api/v1/passports/assets/{thinkpad_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert p_res.status_code == 200
    passport = p_res.json()
    assert passport["total_service_records"] >= 1
    record = passport["records"][0]
    assert "work_performed" in record
    assert "private_technician_notes" not in record # Private notes must NOT be leaked!

    # 2. Customer 2 (unrelated user) cannot view Alice's Repair Passport
    unauth_p = client.get(f"/api/v1/passports/assets/{thinkpad_id}", headers={"Authorization": f"Bearer {customer2_token}"})
    assert unauth_p.status_code == 403

    # 3. Customer Alice creates a sharing grant to a second business
    biz2_res = client.get("/api/v1/businesses/directory").json()
    biz2 = next(b for b in biz2_res if "Velocity" in b["name"])
    biz2_id = biz2["id"]

    grant_res = client.post("/api/v1/sharing-grants", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "asset_id": thinkpad_id,
        "target_business_id": biz2_id,
        "expires_in_days": 30,
        "notes": "Evaluation for secondary warranty"
    })
    assert grant_res.status_code == 200
    grant = grant_res.json()
    grant_id = grant["id"]
    assert grant["status"] == "active"
    assert grant["is_valid"] is True

    # 4. Customer Alice revokes the sharing grant
    revoke_res = client.post(f"/api/v1/sharing-grants/{grant_id}/revoke", headers={"Authorization": f"Bearer {customer_token}"})
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "revoked"
    assert revoke_res.json()["is_valid"] is False
