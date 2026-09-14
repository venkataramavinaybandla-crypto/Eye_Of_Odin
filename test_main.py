import os
from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from main import app, UPLOAD_DIR
from database import engine, Base

client = TestClient(app)

# Reusable binary image fixtures
VALID_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00"
    b"\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

VALID_GIF_BYTES = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04"
    b"\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


@pytest.fixture(autouse=True)
def setup_teardown_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up uploaded test files
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            fp = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(fp):
                try:
                    os.remove(fp)
                except OSError:
                    pass


# ==============================================================================
# EXISTING BASE TESTS (Preserved)
# ==============================================================================

def test_create_report_default_status():
    payload = {
        "category": "bag",
        "color": "Navy Blue",
        "location_zone": "Library",
        "description": "Left behind near front desk",
        "type": "lost"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["status"] == "open"
    assert data["image_path"] is None
    assert data["embedding"] is None
    assert data["category"] == "bag"
    assert data["location_zone"] == "Library"


def test_filter_reports():
    client.post("/reports", json={"category": "bottle", "color": "Red", "location_zone": "Cafeteria", "type": "lost"})
    client.post("/reports", json={"category": "keys", "color": "Silver", "location_zone": "Hostel A", "type": "found"})
    client.post("/reports", json={"category": "electronics", "color": "Black", "location_zone": "Main Gate", "type": "lost"})

    all_res = client.get("/reports")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 3

    lost_res = client.get("/reports?type=lost")
    assert lost_res.status_code == 200
    assert len(lost_res.json()) == 2

    found_res = client.get("/reports?type=found")
    assert found_res.status_code == 200
    assert len(found_res.json()) == 1


def test_get_report_by_id_and_404():
    create_res = client.post("/reports", json={
        "category": "book",
        "color": "Green",
        "location_zone": "Library",
        "type": "found",
        "description": "Algorithms textbook"
    })
    report_id = create_res.json()["id"]

    get_res = client.get(f"/reports/{report_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id

    notFound_res = client.get("/reports/8888")
    assert notFound_res.status_code == 404


def test_upload_image():
    create_res = client.post("/reports", json={
        "category": "id_card",
        "color": "White",
        "location_zone": "Admin Block",
        "type": "lost"
    })
    report_id = create_res.json()["id"]

    files = {"file": ("student_id.png", VALID_PNG_BYTES, "image/png")}
    upload_res = client.post(f"/reports/{report_id}/image", files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["image_path"] == f"uploads/{report_id}_student_id.png"

    # Verify physical file existence
    disk_path = os.path.join(UPLOAD_DIR, f"{report_id}_student_id.png")
    assert os.path.exists(disk_path)
    with open(disk_path, "rb") as f:
        assert f.read() == VALID_PNG_BYTES


# ==============================================================================
# 1. VALIDATION & ERROR HANDLING
# ==============================================================================

def test_create_report_invalid_category():
    payload = {
        "category": "drone",  # Not in locked category list
        "color": "Black",
        "location_zone": "Library",
        "description": "Lost quadcopter",
        "type": "lost"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 422


def test_create_report_invalid_location_zone():
    payload = {
        "category": "electronics",
        "color": "Silver",
        "location_zone": "Rooftop Garden",  # Not in locked 10 zones
        "description": "Lost tablet",
        "type": "lost"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 422


def test_create_report_invalid_type():
    payload = {
        "category": "keys",
        "color": "Gold",
        "location_zone": "Hostel B",
        "description": "Keyring with 2 keys",
        "type": "stolen"  # Must be 'lost' or 'found'
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 422


def test_create_report_missing_required_field():
    # Missing required 'type' field
    payload_missing_type = {
        "category": "book",
        "color": "Blue",
        "location_zone": "Library",
        "description": "Physics workbook"
    }
    res_type = client.post("/reports", json=payload_missing_type)
    assert res_type.status_code == 422

    # Missing required 'category' field
    payload_missing_category = {
        "color": "Blue",
        "location_zone": "Library",
        "description": "Physics workbook",
        "type": "lost"
    }
    res_cat = client.post("/reports", json=payload_missing_category)
    assert res_cat.status_code == 422

    # Missing required 'color' field
    payload_missing_color = {
        "category": "book",
        "location_zone": "Library",
        "description": "Physics workbook",
        "type": "lost"
    }
    res_color = client.post("/reports", json=payload_missing_color)
    assert res_color.status_code == 422


def test_get_report_non_integer_id():
    response = client.get("/reports/abc")
    assert response.status_code == 422


# ==============================================================================
# 2. IMAGE UPLOAD EDGE CASES
# ==============================================================================

def test_upload_image_nonexistent_report():
    files = {"file": ("lost_item.png", VALID_PNG_BYTES, "image/png")}
    response = client.post("/reports/99999/image", files=files)
    assert response.status_code == 404

    # Assert no file was written to uploads/
    uploaded_files = os.listdir(UPLOAD_DIR)
    assert not any(f.startswith("99999_") for f in uploaded_files)


def test_upload_image_overwrite():
    # Create report
    res_create = client.post("/reports", json={
        "category": "bag",
        "color": "Black",
        "location_zone": "Cafeteria",
        "type": "lost"
    })
    report_id = res_create.json()["id"]

    # Upload first image (PNG)
    files_1 = {"file": ("first_photo.png", VALID_PNG_BYTES, "image/png")}
    res_1 = client.post(f"/reports/{report_id}/image", files=files_1)
    assert res_1.status_code == 200
    assert res_1.json()["image_path"] == f"uploads/{report_id}_first_photo.png"
    first_disk_path = os.path.join(UPLOAD_DIR, f"{report_id}_first_photo.png")
    assert os.path.exists(first_disk_path)

    # Upload second image (GIF) to overwrite
    files_2 = {"file": ("second_photo.gif", VALID_GIF_BYTES, "image/gif")}
    res_2 = client.post(f"/reports/{report_id}/image", files=files_2)
    assert res_2.status_code == 200
    assert res_2.json()["image_path"] == f"uploads/{report_id}_second_photo.gif"

    # Verify old file was replaced/removed and new file exists
    second_disk_path = os.path.join(UPLOAD_DIR, f"{report_id}_second_photo.gif")
    assert os.path.exists(second_disk_path)
    assert not os.path.exists(first_disk_path)


def test_upload_non_image_file():
    res_create = client.post("/reports", json={
        "category": "clothing",
        "color": "Grey",
        "location_zone": "Sports Complex",
        "type": "found"
    })
    report_id = res_create.json()["id"]

    # Plain text file disguised as .jpg
    fake_image_content = b"This is a plain text file pretending to be a JPG."
    files = {"file": ("fake_picture.jpg", fake_image_content, "image/jpeg")}
    response = client.post(f"/reports/{report_id}/image", files=files)
    assert response.status_code == 400
    assert "Invalid image file format" in response.json()["detail"]

    # Verify nothing written to disk
    assert not os.path.exists(os.path.join(UPLOAD_DIR, f"{report_id}_fake_picture.jpg"))


def test_upload_image_no_file_attached():
    res_create = client.post("/reports", json={
        "category": "bottle",
        "color": "Green",
        "location_zone": "Library",
        "type": "lost"
    })
    report_id = res_create.json()["id"]

    # POST to /reports/{id}/image without multipart file payload
    response = client.post(f"/reports/{report_id}/image")
    assert response.status_code == 422


# ==============================================================================
# 3. FILTERING & QUERY LOGIC
# ==============================================================================

def test_get_reports_filter_empty_result():
    # Only create 'found' reports
    client.post("/reports", json={
        "category": "keys",
        "color": "Silver",
        "location_zone": "Main Gate",
        "type": "found"
    })

    # Query with type=lost (should return 200 with empty list, not 404)
    response = client.get("/reports?type=lost")
    assert response.status_code == 200
    assert response.json() == []


def test_get_reports_invalid_filter_value():
    # FastAPI validates TypeEnum and rejects invalid query value with 422
    response = client.get("/reports?type=invalidvalue")
    assert response.status_code == 422


def test_get_reports_no_filter():
    client.post("/reports", json={"category": "book", "color": "Red", "location_zone": "Library", "type": "lost"})
    client.post("/reports", json={"category": "bottle", "color": "Blue", "location_zone": "Cafeteria", "type": "found"})

    response = client.get("/reports")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 2
    types = {r["type"] for r in results}
    assert types == {"lost", "found"}


# ==============================================================================
# 4. DATA INTEGRITY
# ==============================================================================

def test_report_field_roundtrip():
    payload = {
        "category": "electronics",
        "color": "Space Grey",
        "location_zone": "Engineering Block",
        "description": "MacBook Pro 14-inch with matte screen protector",
        "type": "lost"
    }
    create_res = client.post("/reports", json=payload)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    get_res = client.get(f"/reports/{created_id}")
    assert get_res.status_code == 200
    data = get_res.json()

    assert data["category"] == payload["category"]
    assert data["color"] == payload["color"]
    assert data["location_zone"] == payload["location_zone"]
    assert data["description"] == payload["description"]
    assert data["type"] == payload["type"]


def test_status_defaults_to_open():
    payload = {
        "category": "other",
        "color": "Brown",
        "location_zone": "Auditorium",
        "description": "Wooden umbrella handle",
        "type": "found"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "open"


def test_timestamp_auto_generated():
    payload = {
        "category": "id_card",
        "color": "White/Blue",
        "location_zone": "Admin Block",
        "type": "lost"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["timestamp"] is not None
    # Verify ISO-8601 parsable datetime
    parsed_dt = datetime.fromisoformat(data["timestamp"])
    assert isinstance(parsed_dt, datetime)


# ==============================================================================
# 5. EMBEDDING FIELD
# ==============================================================================

def test_report_embedding_null_on_creation():
    """
    Lock-in test for current behavior: embedding is null upon report creation.
    NOTE: CLIP embedding generation logic is deferred to Phase 1.
    """
    payload = {
        "category": "clothing",
        "color": "Red",
        "location_zone": "Sports Complex",
        "description": "Varsity hoodie",
        "type": "lost"
    }
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["embedding"] is None
