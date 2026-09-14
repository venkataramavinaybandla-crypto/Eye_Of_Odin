import requests
import os
import json
import time

API_BASE = "http://127.0.0.1:8000"

def main():
    print("================================================================================")
    print("         EYE OF ODIN: END-TO-END MATCHING ENGINE & WORKFLOW TEST                ")
    print("================================================================================")

    # 1. Health check
    res = requests.get(f"{API_BASE}/reports")
    assert res.status_code == 200, f"Backend not reachable: {res.status_code}"
    print("[1] Backend is healthy at http://127.0.0.1:8000")

    # 2. Create LOST Report
    lost_data = {
        "category": "bag",
        "color": "Black",
        "location_zone": "Library",
        "description": "Black canvas laptop backpack lost near 2nd floor library study tables.",
        "type": "lost"
    }
    res_lost = requests.post(f"{API_BASE}/reports", json=lost_data)
    assert res_lost.status_code == 201
    lost_id = res_lost.json()["id"]
    print(f"[2] Created LOST report #{lost_id} (Black bag, Library)")

    # 3. Upload image for LOST report
    img1_path = os.path.join("test_images", "sample_black_bag_1.png")
    with open(img1_path, "rb") as f:
        res_upload1 = requests.post(
            f"{API_BASE}/reports/{lost_id}/image",
            files={"file": ("sample_black_bag_1.png", f, "image/png")}
        )
    assert res_upload1.status_code == 200
    lost_report = res_upload1.json()
    assert lost_report["embedding"] is not None
    emb_dict = json.loads(lost_report["embedding"])
    assert "image" in emb_dict and len(emb_dict["image"]) == 512
    print(f"[3] Uploaded image to LOST report #{lost_id} -> 512-dim CLIP embedding generated & persisted!")

    # 4. Create FOUND Report A (Matching: Black bag in Library)
    found_match_data = {
        "category": "bag",
        "color": "Black",
        "location_zone": "Library",
        "description": "Black Herschel backpack found under table 14 in Library reading room.",
        "type": "found"
    }
    res_found_match = requests.post(f"{API_BASE}/reports", json=found_match_data)
    assert res_found_match.status_code == 201
    found_match_id = res_found_match.json()["id"]
    print(f"[4] Created FOUND report #{found_match_id} (Matching black bag, Library)")

    # 5. Upload similar image for FOUND Report A
    img2_path = os.path.join("test_images", "sample_black_bag_2.png")
    with open(img2_path, "rb") as f:
        res_upload2 = requests.post(
            f"{API_BASE}/reports/{found_match_id}/image",
            files={"file": ("sample_black_bag_2.png", f, "image/png")}
        )
    assert res_upload2.status_code == 200
    print(f"[5] Uploaded image to FOUND report #{found_match_id} -> Embedding persisted!")

    # 6. Create FOUND Report B (Dissimilar: Red bottle in Cafeteria)
    found_other_data = {
        "category": "bottle",
        "color": "Red",
        "location_zone": "Cafeteria",
        "description": "Red stainless steel water bottle left on cafeteria dining counter.",
        "type": "found"
    }
    res_found_other = requests.post(f"{API_BASE}/reports", json=found_other_data)
    assert res_found_other.status_code == 201
    found_other_id = res_found_other.json()["id"]
    print(f"[6] Created FOUND report #{found_other_id} (Dissimilar red bottle, Cafeteria)")

    # 7. Upload dissimilar image for FOUND Report B
    img3_path = os.path.join("test_images", "sample_red_bottle_unrelated.png")
    with open(img3_path, "rb") as f:
        res_upload3 = requests.post(
            f"{API_BASE}/reports/{found_other_id}/image",
            files={"file": ("sample_red_bottle_unrelated.png", f, "image/png")}
        )
    assert res_upload3.status_code == 200
    print(f"[7] Uploaded image to FOUND report #{found_other_id} -> Embedding persisted!")

    # 8. Query GET /reports/{lost_id}/matches
    print(f"\n[8] Querying GET /reports/{lost_id}/matches ...")
    res_matches = requests.get(f"{API_BASE}/reports/{lost_id}/matches")
    assert res_matches.status_code == 200
    candidates = res_matches.json()
    print(f"    Returned {len(candidates)} candidate matches.")

    assert len(candidates) >= 2, "Expected at least 2 candidates"
    top_candidate = candidates[0]
    print(f"    Top Match: Report #{top_candidate['id']} ({top_candidate['category']}, {top_candidate['color']})")
    print(f"      Confidence:     {top_candidate['confidence']}%")
    print(f"      Image Sim:      {top_candidate['image_sim']}")
    print(f"      Text Sim:       {top_candidate['text_sim']}")
    print(f"      Category Match: {top_candidate['category_match']}")
    print(f"      Color Match:    {top_candidate['color_match']}")
    print(f"      Zone Match:     {top_candidate['zone_match']}")

    assert top_candidate["id"] == found_match_id, f"Expected top match to be report #{found_match_id}, got #{top_candidate['id']}"
    assert top_candidate["confidence"] >= 80, f"Expected confidence >= 80%, got {top_candidate['confidence']}%"

    second_candidate = [c for c in candidates if c["id"] == found_other_id][0]
    print(f"\n    Unrelated Candidate: Report #{second_candidate['id']} ({second_candidate['category']}, {second_candidate['color']})")
    print(f"      Confidence:     {second_candidate['confidence']}%")
    print(f"      Image Sim:      {second_candidate['image_sim']}")
    print(f"      Margin (Top - Unrelated): {top_candidate['confidence'] - second_candidate['confidence']}%")

    assert top_candidate["confidence"] > second_candidate["confidence"] + 20, "Margin between top match and unrelated candidate too narrow"

    # 9. Test match resolution via POST /reports/resolve-pair
    print(f"\n[9] Testing POST /reports/resolve-pair for reports #{lost_id} and #{found_match_id} ...")
    res_resolve = requests.post(
        f"{API_BASE}/reports/resolve-pair",
        json={"report_id_a": lost_id, "report_id_b": found_match_id}
    )
    assert res_resolve.status_code == 200
    resolve_data = res_resolve.json()
    print(f"    Resolution response: {resolve_data['message']}")
    assert resolve_data["report_a"]["status"] == "resolved"
    assert resolve_data["report_b"]["status"] == "resolved"

    # 10. Verify persistence via fresh GET queries
    print("\n[10] Verifying persistence on fresh GET queries ...")
    r_lost_check = requests.get(f"{API_BASE}/reports/{lost_id}").json()
    r_found_check = requests.get(f"{API_BASE}/reports/{found_match_id}").json()
    assert r_lost_check["status"] == "resolved"
    assert r_found_check["status"] == "resolved"
    print(f"    Report #{lost_id} status: {r_lost_check['status']}")
    print(f"    Report #{found_match_id} status: {r_found_check['status']}")

    # 11. Verify resolved report is excluded from open match candidates
    res_matches_after = requests.get(f"{API_BASE}/reports/{lost_id}/matches").json()
    candidate_ids_after = [c["id"] for c in res_matches_after]
    assert found_match_id not in candidate_ids_after, "Resolved candidate should no longer appear in open matches"
    print("    Resolved item is properly excluded from subsequent candidate searches.")

    print("\n" + "=" * 80)
    print(">>> ALL END-TO-END MATCHING ENGINE WORKFLOW TESTS PASSED SUCCESSFULLY! <<<")
    print("================================================================================")


if __name__ == "__main__":
    main()
