def test_admin_rbac_and_audit(client, admin_token, customer_token):
    # 1. Customer attempting to access admin endpoint is rejected
    cust_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {customer_token}"})
    assert cust_res.status_code == 403

    # 2. Admin can list users
    admin_users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_users.status_code == 200
    assert len(admin_users.json()) >= 3

    # 3. Admin can inspect audit logs
    logs_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)

    # 4. Admin can verify a business
    bizs = client.get("/api/v1/businesses/directory").json()
    biz_id = bizs[0]["id"]
    verify_res = client.put(f"/api/v1/admin/businesses/{biz_id}/verify", headers={"Authorization": f"Bearer {admin_token}"}, json={
        "is_verified": True,
        "notes": "Verified business license and insurance"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True
