import os
import json
from embedding import embed_text, cosine_similarity

def compute_pair_score(item_a, item_b, text_emb_cache):
    desc_a = item_a.get("description", "")
    desc_b = item_b.get("description", "")

    if desc_a not in text_emb_cache:
        text_emb_cache[desc_a] = embed_text(desc_a)
    if desc_b not in text_emb_cache:
        text_emb_cache[desc_b] = embed_text(desc_b)

    vec_a = text_emb_cache[desc_a]
    vec_b = text_emb_cache[desc_b]

    text_sim = cosine_similarity(vec_a, vec_b) if (vec_a and vec_b) else 0.0

    cat_match = 1.0 if (item_a.get("category", "").lower() == item_b.get("category", "").lower()) else 0.0
    col_match = 1.0 if (item_a.get("color", "").lower() == item_b.get("color", "").lower()) else 0.0
    zone_match = 1.0 if (item_a.get("location_zone", "").lower() == item_b.get("location_zone", "").lower()) else 0.0

    # Dynamic weights when text is available (no image in pure text/metadata evaluation):
    # w_txt: 0.40, w_cat: 0.30, w_col: 0.20, w_zone: 0.10
    w_txt, w_cat, w_col, w_zone = 0.40, 0.30, 0.20, 0.10
    raw_score = (w_txt * text_sim + w_cat * cat_match + w_col * col_match + w_zone * zone_match)
    confidence = max(0, min(100, int(round(raw_score * 100))))

    return {
        "confidence": confidence,
        "text_sim": round(text_sim, 4),
        "category_match": bool(cat_match),
        "color_match": bool(col_match),
        "zone_match": bool(zone_match),
    }


def main():
    dataset_path = os.path.join(os.path.dirname(__file__), "test_match_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    print("=" * 80)
    print("      EYE OF ODIN: CONFIDENCE FUSION & DATASET EVALUATION (STEP 4)     ")
    print("=" * 80)
    print(f"Loaded {len(dataset)} labeled pairs from {dataset_path}")

    text_emb_cache = {}
    results = []

    for pair in dataset:
        scores = compute_pair_score(pair["item_a"], pair["item_b"], text_emb_cache)
        is_match = pair["is_match"]
        conf = scores["confidence"]
        predicted_match = conf >= 50  # 50% candidate threshold
        correct = (predicted_match == is_match)
        results.append({
            "id": pair["id"],
            "is_match": is_match,
            "conf": conf,
            "predicted": predicted_match,
            "correct": correct,
            "scores": scores,
            "cat_a": pair["item_a"]["category"],
            "col_a": pair["item_a"]["color"],
            "cat_b": pair["item_b"]["category"],
            "col_b": pair["item_b"]["color"],
        })

    true_matches = [r for r in results if r["is_match"]]
    false_matches = [r for r in results if not r["is_match"]]

    avg_true_conf = sum(r["conf"] for r in true_matches) / len(true_matches)
    avg_false_conf = sum(r["conf"] for r in false_matches) / len(false_matches)

    tp = sum(1 for r in results if r["is_match"] and r["predicted"])
    fp = sum(1 for r in results if not r["is_match"] and r["predicted"])
    fn = sum(1 for r in results if r["is_match"] and not r["predicted"])
    tn = sum(1 for r in results if not r["is_match"] and not r["predicted"])

    accuracy = (tp + tn) / len(results)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    print("\n{:<4} {:<8} {:<12} {:<10} {:<10} {:<8} {:<8} {:<8}".format(
        "ID", "Type", "Confidence", "Cat Match", "Col Match", "Zone Match", "Text Sim", "Result"
    ))
    print("-" * 80)
    for r in results:
        status_str = "PASS" if r["correct"] else "FAIL"
        match_type = "TRUE" if r["is_match"] else "FALSE"
        s = r["scores"]
        print("{:<4} {:<8} {:<12} {:<10} {:<10} {:<8} {:<8} {:<8}".format(
            r["id"],
            match_type,
            f"{r['conf']}%",
            str(s["category_match"]),
            str(s["color_match"]),
            str(s["zone_match"]),
            f"{s['text_sim']:.3f}",
            status_str
        ))

    print("\n" + "=" * 80)
    print("SUMMARY METRICS")
    print("=" * 80)
    print(f"Total Evaluated Pairs:       {len(results)}")
    print(f"True Match Pairs:            {len(true_matches)}")
    print(f"False Match Pairs:           {len(false_matches)}")
    print(f"Average True Match Score:    {avg_true_conf:.2f}%")
    print(f"Average False Match Score:   {avg_false_conf:.2f}%")
    print(f"Separation Margin:           {avg_true_conf - avg_false_conf:+.2f}%")
    print(f"Accuracy:                    {accuracy * 100:.1f}% ({tp + tn}/{len(results)})")
    print(f"Precision:                   {precision * 100:.1f}% ({tp}/{tp + fp})")
    print(f"Recall:                      {recall * 100:.1f}% ({tp}/{tp + fn})")
    print(f"F1-Score:                    {f1 * 100:.1f}%")
    print("=" * 80)

    # Verification assertions
    assert avg_true_conf > 70.0, f"Average true match score too low: {avg_true_conf}%"
    assert avg_false_conf < 35.0, f"Average false match score too high: {avg_false_conf}%"
    assert accuracy >= 0.90, f"Accuracy too low: {accuracy * 100}%"
    print("\n>>> EVALUATION PASSED: Confidence fusion accurately separates true from false matches! <<<\n")


if __name__ == "__main__":
    main()
