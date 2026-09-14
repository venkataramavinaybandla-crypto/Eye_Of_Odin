import json
import os
import sys
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from fastapi.testclient import TestClient

from main import app, UPLOAD_DIR
import models
from database import engine, Base

client = TestClient(app)

IMG_DIR = os.path.join(os.path.dirname(__file__), "test_images")
os.makedirs(IMG_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. Generate Placeholder Test Images
# ---------------------------------------------------------------------------
def generate_test_images():
    """Generate simple distinct placeholder images for testing CLIP fusion pipeline."""
    images = {
        "black_bag.png": ("#1E1E1E", "#4A4A4A", "BLACK BAG"),
        "navy_backpack.png": ("#0F172A", "#1E293B", "NAVY BAG"),
        "silver_laptop.png": ("#94A3B8", "#E2E8F0", "SILVER LAPTOP"),
        "black_phone.png": ("#09090B", "#27272A", "BLACK PHONE"),
        "blue_bottle.png": ("#0284C7", "#38BDF8", "BLUE BOTTLE"),
        "red_flask.png": ("#DC2626", "#F87171", "RED FLASK"),
        "silver_keys.png": ("#64748B", "#CBD5E1", "SILVER KEYS"),
        "grey_hoodie.png": ("#475569", "#94A3B8", "GREY HOODIE"),
        "green_textbook.png": ("#15803D", "#4ADE80", "GREEN BOOK"),
    }

    generated_paths = {}
    for filename, (bg_color, accent_color, text) in images.items():
        filepath = os.path.join(IMG_DIR, filename)
        img = Image.new("RGB", (300, 300), color=bg_color)
        draw = ImageDraw.Draw(img)
        # Draw central accent shape
        draw.rectangle([50, 50, 250, 250], outline=accent_color, width=8)
        draw.ellipse([80, 80, 220, 220], fill=accent_color)
        draw.text((85, 140), text, fill="#FFFFFF")
        img.save(filepath, format="PNG")
        generated_paths[filename] = filepath

    print(f"Generated {len(generated_paths)} sample test images in {IMG_DIR}")
    return generated_paths


# ---------------------------------------------------------------------------
# 2. Main Test Session Runner
# ---------------------------------------------------------------------------
def run_precision_test():
    print("=" * 80)
    print(" EYE OF ODIN — PHASE 1 PRECISION TEST SESSION ")
    print("=" * 80)

    # 1. Reset Database & Uploads for Clean Precision Run
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, f)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass

    img_map = generate_test_images()

    # 2. Define 15 Items for LOST and 15 Items for FOUND
    # True match pairs will be (LOST i, FOUND i) for i in 1..15
    items_data = [
        # 1: Black Bag
        {
            "lost": {"category": "bag", "color": "Black", "location_zone": "Library", "description": "Black Herschel backpack left near 2nd-floor quiet study section.", "type": "lost"},
            "found": {"category": "bag", "color": "Black", "location_zone": "Library", "description": "Black backpack found under table 14 in Library reading room.", "type": "found"},
            "img": "black_bag.png"
        },
        # 2: Navy Backpack
        {
            "lost": {"category": "bag", "color": "Navy", "location_zone": "Engineering Block", "description": "Navy Blue Jansport bag containing notebooks.", "type": "lost"},
            "found": {"category": "bag", "color": "Navy", "location_zone": "Engineering Block", "description": "Dark navy blue backpack handed in at lab reception.", "type": "found"},
            "img": "navy_backpack.png"
        },
        # 3: Silver Laptop
        {
            "lost": {"category": "electronics", "color": "Silver", "location_zone": "Engineering Block", "description": "Dell XPS 13 inch laptop with Linux stickers on the lid.", "type": "lost"},
            "found": {"category": "electronics", "color": "Silver", "location_zone": "Engineering Block", "description": "Silver Dell laptop computer found in Lab 302.", "type": "found"},
            "img": "silver_laptop.png"
        },
        # 4: Black Phone
        {
            "lost": {"category": "electronics", "color": "Black", "location_zone": "Cafeteria", "description": "Black iPhone 14 with cracked screen protector.", "type": "lost"},
            "found": {"category": "electronics", "color": "Black", "location_zone": "Cafeteria", "description": "Black Apple smartphone left on food court counter.", "type": "found"},
            "img": "black_phone.png"
        },
        # 5: Blue Bottle
        {
            "lost": {"category": "bottle", "color": "Blue", "location_zone": "Cafeteria", "description": "Hydro Flask 32oz blue bottle with dent on bottom.", "type": "lost"},
            "found": {"category": "bottle", "color": "Blue", "location_zone": "Cafeteria", "description": "Blue metal Hydro Flask water bottle found near drinks station.", "type": "found"},
            "img": "blue_bottle.png"
        },
        # 6: Red Flask
        {
            "lost": {"category": "bottle", "color": "Red", "location_zone": "Hostel A", "description": "Red Thermos metal insulated flask.", "type": "lost"},
            "found": {"category": "bottle", "color": "Red", "location_zone": "Hostel A", "description": "Red metal flask water bottle picked up in lobby.", "type": "found"},
            "img": "red_flask.png"
        },
        # 7: Silver Keys
        {
            "lost": {"category": "keys", "color": "Silver", "location_zone": "Hostel A", "description": "Set of 3 silver keys on a red lanyard.", "type": "lost"},
            "found": {"category": "keys", "color": "Silver", "location_zone": "Hostel A", "description": "Silver keys attached to red lanyard.", "type": "found"},
            "img": "silver_keys.png"
        },
        # 8: Grey Hoodie
        {
            "lost": {"category": "clothing", "color": "Grey", "location_zone": "Sports Complex", "description": "Grey Nike pullover hoodie size L.", "type": "lost"},
            "found": {"category": "clothing", "color": "Grey", "location_zone": "Sports Complex", "description": "Grey hooded athletic sweater left on gym bench.", "type": "found"},
            "img": "grey_hoodie.png"
        },
        # 9: Green Textbook
        {
            "lost": {"category": "book", "color": "Green", "location_zone": "Library", "description": "Green Computer Science Data Structures textbook.", "type": "lost"},
            "found": {"category": "book", "color": "Green", "location_zone": "Library", "description": "Green cover CS course textbook found on study desk.", "type": "found"},
            "img": "green_textbook.png"
        },
        # 10: Black Shoulder Bag
        {
            "lost": {"category": "bag", "color": "Black", "location_zone": "Admin Block", "description": "Black leather shoulder handbag with zipper.", "type": "lost"},
            "found": {"category": "bag", "color": "Black", "location_zone": "Admin Block", "description": "Black leather handbag turned in to administration.", "type": "found"},
            "img": "black_bag.png"
        },
        # 11: Silver MacBook
        {
            "lost": {"category": "electronics", "color": "Silver", "location_zone": "Library", "description": "Silver MacBook Pro 16 inch in sleeve.", "type": "lost"},
            "found": {"category": "electronics", "color": "Silver", "location_zone": "Library", "description": "Silver Apple laptop computer in black sleeve.", "type": "found"},
            "img": "silver_laptop.png"
        },
        # 12: Blue Stainless Bottle
        {
            "lost": {"category": "bottle", "color": "Blue", "location_zone": "Sports Complex", "description": "Blue insulated stainless steel sports bottle.", "type": "lost"},
            "found": {"category": "bottle", "color": "Blue", "location_zone": "Sports Complex", "description": "Blue stainless water bottle left by football field.", "type": "found"},
            "img": "blue_bottle.png"
        },
        # 13: Silver Room Keys
        {
            "lost": {"category": "keys", "color": "Silver", "location_zone": "Hostel B", "description": "Silver room key with number tag 204.", "type": "lost"},
            "found": {"category": "keys", "color": "Silver", "location_zone": "Hostel B", "description": "Bunch of silver keys found near hostel security.", "type": "found"},
            "img": "silver_keys.png"
        },
        # 14: Grey Jacket
        {
            "lost": {"category": "clothing", "color": "Grey", "location_zone": "Auditorium", "description": "Grey fleece zip jacket.", "type": "lost"},
            "found": {"category": "clothing", "color": "Grey", "location_zone": "Auditorium", "description": "Grey zip-up jacket sweater found on seat row D.", "type": "found"},
            "img": "grey_hoodie.png"
        },
        # 15: Green Math Book
        {
            "lost": {"category": "book", "color": "Green", "location_zone": "Engineering Block", "description": "Green Linear Algebra hardbound textbook.", "type": "lost"},
            "found": {"category": "book", "color": "Green", "location_zone": "Engineering Block", "description": "Green mathematics book found in lecture hall 1.", "type": "found"},
            "img": "green_textbook.png"
        },
    ]

    print("Creating reports and computing embeddings via API endpoints...")
    lost_ids = []
    found_ids = []

    # Post all lost and found reports
    for idx, item in enumerate(items_data, 1):
        # Create Lost
        res_l = client.post("/reports", json=item["lost"])
        assert res_l.status_code == 201
        l_id = res_l.json()["id"]
        lost_ids.append(l_id)
        # Upload image for lost
        img_path = img_map[item["img"]]
        with open(img_path, "rb") as f:
            res_img_l = client.post(f"/reports/{l_id}/image", files={"file": ("item.png", f, "image/png")})
            assert res_img_l.status_code == 200

        # Create Found
        res_f = client.post("/reports", json=item["found"])
        assert res_f.status_code == 201
        f_id = res_f.json()["id"]
        found_ids.append(f_id)
        # Upload image for found
        with open(img_path, "rb") as f:
            res_img_f = client.post(f"/reports/{f_id}/image", files={"file": ("item.png", f, "image/png")})
            assert res_img_f.status_code == 200

    print(f"Created {len(lost_ids)} LOST reports and {len(found_ids)} FOUND reports.")

    # 3. Construct 30 Ground Truth Pairs (15 True Matches, 15 False Matches)
    test_pairs = []
    pair_counter = 1

    # 15 TRUE MATCH PAIRS: (lost_ids[i], found_ids[i])
    for i in range(15):
        test_pairs.append({
            "pair_id": pair_counter,
            "report_id_a": lost_ids[i],
            "report_id_b": found_ids[i],
            "is_match": True,
            "category_a": items_data[i]["lost"]["category"],
            "category_b": items_data[i]["found"]["category"],
        })
        pair_counter += 1

    # 15 FALSE MATCH PAIRS: Mismatched combinations (lost_ids[i], found_ids[(i + 5) % 15])
    # e.g., lost Bag vs found Bottle, lost Laptop vs found Book, etc.
    for i in range(15):
        target_idx = (i + 5) % 15
        test_pairs.append({
            "pair_id": pair_counter,
            "report_id_a": lost_ids[i],
            "report_id_b": found_ids[target_idx],
            "is_match": False,
            "category_a": items_data[i]["lost"]["category"],
            "category_b": items_data[target_idx]["found"]["category"],
        })
        pair_counter += 1

    # Save ground truth test_pairs.json (format requested: [{"report_id_a": X, "report_id_b": Y, "is_match": bool}])
    ground_truth_json = [
        {"report_id_a": p["report_id_a"], "report_id_b": p["report_id_b"], "is_match": p["is_match"]}
        for p in test_pairs
    ]
    test_pairs_path = os.path.join(os.path.dirname(__file__), "test_pairs.json")
    with open(test_pairs_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth_json, f, indent=2)
    print(f"Saved ground truth dataset with {len(ground_truth_json)} entries to {test_pairs_path}")

    # 4. Evaluate Each Pair Using Real API Endpoint `/reports/{id}/matches`
    print("\nRunning match evaluation across all 30 report pairs...\n")

    results_table = []
    true_match_scores = []
    false_match_scores = []
    correct_count_50 = 0

    print("-" * 88)
    print(f"{'PAIR ID':<8} | {'REPORT A (LOST)':<15} | {'REPORT B (FOUND)':<16} | {'GROUND TRUTH':<12} | {'CONFIDENCE':<10} | {'STATUS':<10}")
    print("-" * 88)

    for p in test_pairs:
        pair_id = p["pair_id"]
        rep_a = p["report_id_a"]
        rep_b = p["report_id_b"]
        is_match = p["is_match"]

        # Call real match endpoint
        res = client.get(f"/reports/{rep_a}/matches")
        assert res.status_code == 200
        matches = res.json()

        # Find confidence score for rep_b
        score_obj = next((m for m in matches if m["id"] == rep_b), None)
        confidence = score_obj["confidence"] if score_obj else 0

        if is_match:
            true_match_scores.append(confidence)
            # Correctly ranked if score >= 50%
            is_correct = confidence >= 50
        else:
            false_match_scores.append(confidence)
            # Correctly ranked if score < 50%
            is_correct = confidence < 50

        if is_correct:
            correct_count_50 += 1

        status_str = "CORRECT" if is_correct else "MISRANKED"
        gt_str = "TRUE MATCH" if is_match else "FALSE MATCH"

        print(f"{pair_id:<8} | Report #{rep_a:<8} ({p['category_a']:<5}) | Report #{rep_b:<9} ({p['category_b']:<5}) | {gt_str:<12} | {confidence:>8}% | {status_str:<10}")

        results_table.append({
            "pair_id": pair_id,
            "report_id_a": rep_a,
            "report_id_b": rep_b,
            "is_match": is_match,
            "confidence": confidence,
            "status": status_str,
        })

    print("-" * 88)

    # 5. Compute Summary Metrics
    avg_true = sum(true_match_scores) / len(true_match_scores) if true_match_scores else 0.0
    avg_false = sum(false_match_scores) / len(false_match_scores) if false_match_scores else 0.0

    print("\n" + "=" * 80)
    print(" SUMMARY METRICS ")
    print("=" * 80)
    print(f"1. Average True-Match Confidence:  {avg_true:.2f}%")
    print(f"2. Average False-Match Confidence: {avg_false:.2f}%")
    print(f"3. Correctly Ranked Count (50% Threshold): {correct_count_50} / 30 ({correct_count_50 / 30 * 100:.1f}%)")

    verdict = ""
    if avg_true - avg_false > 30 and correct_count_50 >= 24:
        verdict = "The current fusion weights produce strong separation between true and false matches."
    elif avg_true > avg_false:
        verdict = "The current fusion weights distinguish matches directionally, but overlap exists and fine-tuning weights is recommended."
    else:
        verdict = "The current fusion weights fail to separate true and false matches cleanly and require reweighting."

    print(f"\nVERDICT: {verdict}")
    print("=" * 80)

if __name__ == "__main__":
    run_precision_test()
