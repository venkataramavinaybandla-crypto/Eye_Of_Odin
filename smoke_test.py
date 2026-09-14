import json
import os
import sys
from io import BytesIO
from fastapi.testclient import TestClient
from main import app, UPLOAD_DIR
import models
from database import engine, Base

client = TestClient(app)


def print_step(title: str, response=None, extra_info: str = ""):
    print("\n" + "=" * 70)
    print(f"STEP: {title}")
    print("=" * 70)
    if extra_info:
        print(extra_info)
    if response is not None:
        print(f"HTTP Status: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2, default=str))


def run_smoke_test():
    # 1. Reset/Clean DB for clean demo run
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Clean uploads directory
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(file_path):
                os.remove(file_path)

    print("Running Eye of Odin Backend Smoke Test...")

    # Step 1: Create 3 LOST reports
    lost_items = [
        {
            "category": "bag",
            "color": "Black",
            "location_zone": "Library",
            "description": "Black Herschel backpack left near 2nd-floor quiet study section.",
            "type": "lost"
        },
        {
            "category": "electronics",
            "color": "Silver",
            "location_zone": "Engineering Block",
            "description": "Dell XPS 13 inch laptop with Linux stickers on the lid.",
            "type": "lost"
        },
        {
            "category": "bottle",
            "color": "Blue",
            "location_zone": "Cafeteria",
            "description": "Hydro Flask 32oz blue bottle with dent on the bottom rim.",
            "type": "lost"
        }
    ]

    created_lost_ids = []
    for idx, item in enumerate(lost_items, 1):
        res = client.post("/reports", json=item)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}"
        created_lost_ids.append(res.json()["id"])
        print_step(f"1.{idx} Create Lost Report #{idx}", res)

    # Step 2: Create 3 FOUND reports
    found_items = [
        {
            "category": "bag",
            "color": "Black",
            "location_zone": "Library",
            "description": "Black backpack found under table 14 in Library reading room.",
            "type": "found"
        },
        {
            "category": "electronics",
            "color": "Silver",
            "location_zone": "Engineering Block",
            "description": "Silver Dell laptop handed in to Lab 302 technician.",
            "type": "found"
        },
        {
            "category": "keys",
            "color": "Silver",
            "location_zone": "Hostel A",
            "description": "Set of 3 keys on a red lanyard near hostel entrance.",
            "type": "found"
        }
    ]

    created_found_ids = []
    for idx, item in enumerate(found_items, 1):
        res = client.post("/reports", json=item)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}"
        created_found_ids.append(res.json()["id"])
        print_step(f"2.{idx} Create Found Report #{idx}", res)

    # Step 3: List all reports & Filter by type
    res_all = client.get("/reports")
    assert res_all.status_code == 200
    assert len(res_all.json()) == 6
    print_step("3.1 List All Reports (Total: 6)", res_all)

    res_lost = client.get("/reports?type=lost")
    assert res_lost.status_code == 200
    assert len(res_lost.json()) == 3
    print_step("3.2 List Filtered: ?type=lost (Total: 3)", res_lost)

    res_found = client.get("/reports?type=found")
    assert res_found.status_code == 200
    assert len(res_found.json()) == 3
    print_step("3.3 List Filtered: ?type=found (Total: 3)", res_found)

    # Step 4: Fetch single report by ID
    target_id = created_lost_ids[0]
    res_single = client.get(f"/reports/{target_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == target_id
    print_step(f"4.1 Fetch Single Report (ID: {target_id})", res_single)

    # Step 4.2: Verify 404 for nonexistent ID
    res_404 = client.get("/reports/99999")
    assert res_404.status_code == 404
    print_step("4.2 Fetch Nonexistent Report (ID: 99999 -> 404 Not Found)", res_404)

    # Step 5: Upload image to report
    sample_image_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    files = {
        "file": ("black_backpack.jpg", sample_image_bytes, "image/jpeg")
    }
    res_upload = client.post(f"/reports/{target_id}/image", files=files)
    assert res_upload.status_code == 200
    upload_data = res_upload.json()
    assert upload_data["image_path"] is not None
    print_step(f"5.1 Upload Image to Report (ID: {target_id})", res_upload)

    # Verify physical file existence on disk
    expected_disk_path = os.path.join(os.path.dirname(__file__), upload_data["image_path"].replace("/", os.sep))
    file_exists = os.path.exists(expected_disk_path)
    file_size = os.path.getsize(expected_disk_path) if file_exists else 0
    print_step(
        "5.2 Physical Disk Verification",
        extra_info=f"Expected Path: {expected_disk_path}\nFile Exists on Disk: {file_exists}\nFile Size: {file_size} bytes"
    )
    assert file_exists, f"File not found on disk at {expected_disk_path}"

    print("\n" + "=" * 70)
    print("ALL SMOKE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_smoke_test()
