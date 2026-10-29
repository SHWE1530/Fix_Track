def test_asset_crud_and_ownership(client, customer_token, customer2_token):
    # Customer 1 creates an asset
    create_res = client.post("/api/v1/assets", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "category": "laptops_computers",
        "make": "Dell",
        "model": "XPS 15 9520",
        "year": 2022,
        "serial_number": "SN-DELL-9988",
        "color": "Platinum Silver",
        "notes": "Developer machine",
        "metadata": {"cpu": "Core i9", "ram": "64GB"}
    })
    assert create_res.status_code == 200
    asset_data = create_res.json()
    asset_id = asset_data["id"]
    assert asset_data["make"] == "Dell"
    assert asset_data["model"] == "XPS 15 9520"

    # Customer 1 can get the asset
    get_res = client.get(f"/api/v1/assets/{asset_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert get_res.status_code == 200
    assert get_res.json()["serial_number"] == "SN-DELL-9988"

    # Customer 2 (who does not own it and has no active job/grant) must be forbidden
    c2_res = client.get(f"/api/v1/assets/{asset_id}", headers={"Authorization": f"Bearer {customer2_token}"})
    assert c2_res.status_code == 403

    # Customer 1 can update asset
    update_res = client.put(f"/api/v1/assets/{asset_id}", headers={"Authorization": f"Bearer {customer_token}"}, json={
        "notes": "Updated developer machine notes"
    })
    assert update_res.status_code == 200
    assert update_res.json()["notes"] == "Updated developer machine notes"

    # Customer 2 cannot update asset
    c2_update = client.put(f"/api/v1/assets/{asset_id}", headers={"Authorization": f"Bearer {customer2_token}"}, json={
        "make": "Hacked"
    })
    assert c2_update.status_code == 403
