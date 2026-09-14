import os
from PIL import Image, ImageDraw
from embedding import embed_image, cosine_similarity

def create_sample_images():
    os.makedirs("test_images", exist_ok=True)

    # Image 1: Dark black bag / backpack mockup
    img1 = Image.new("RGB", (256, 256), color=(240, 240, 240))
    d1 = ImageDraw.Draw(img1)
    # Draw backpack body (black rectangle with rounded top)
    d1.rounded_rectangle([(60, 50), (196, 220)], radius=20, fill=(25, 25, 25), outline=(10, 10, 10))
    # Zipper & pocket
    d1.rectangle([(80, 120), (176, 190)], fill=(40, 40, 40), outline=(60, 60, 60))
    d1.line([(80, 120), (176, 120)], fill=(120, 120, 120), width=2)
    path1 = os.path.join("test_images", "sample_black_bag_1.png")
    img1.save(path1)

    # Image 2: Similar dark black backpack mockup (slightly different angle/pocket)
    img2 = Image.new("RGB", (256, 256), color=(235, 235, 235))
    d2 = ImageDraw.Draw(img2)
    # Similar backpack silhouette
    d2.rounded_rectangle([(55, 45), (200, 225)], radius=25, fill=(30, 30, 30), outline=(15, 15, 15))
    d2.rectangle([(75, 110), (180, 185)], fill=(45, 45, 45), outline=(70, 70, 70))
    d2.line([(75, 110), (180, 110)], fill=(130, 130, 130), width=2)
    path2 = os.path.join("test_images", "sample_black_bag_2.png")
    img2.save(path2)

    # Image 3: Unrelated item - bright red water bottle
    img3 = Image.new("RGB", (256, 256), color=(240, 240, 240))
    d3 = ImageDraw.Draw(img3)
    # Draw tall red cylinder bottle
    d3.rounded_rectangle([(100, 70), (156, 230)], radius=15, fill=(210, 35, 35), outline=(160, 20, 20))
    # Silver cap
    d3.rectangle([(110, 45), (146, 70)], fill=(200, 200, 200), outline=(150, 150, 150))
    path3 = os.path.join("test_images", "sample_red_bottle_unrelated.png")
    img3.save(path3)

    return path1, path2, path3


def main():
    print("==================================================")
    print("       CLIP EMBEDDING SANITY TEST (STEP 1)        ")
    print("==================================================")
    print("Generating sample test images...")
    p1, p2, p3 = create_sample_images()
    print(f"  Item 1 (Similar A): {p1} [Black Backpack A]")
    print(f"  Item 2 (Similar B): {p2} [Black Backpack B]")
    print(f"  Item 3 (Unrelated): {p3} [Red Water Bottle]")

    print("\nComputing 512-dimensional CLIP embeddings...")
    emb1 = embed_image(p1)
    emb2 = embed_image(p2)
    emb3 = embed_image(p3)

    print(f"Vector dimensions: Item 1 = {len(emb1)}, Item 2 = {len(emb2)}, Item 3 = {len(emb3)}")

    sim_similar = cosine_similarity(emb1, emb2)
    sim_unrelated_1 = cosine_similarity(emb1, emb3)
    sim_unrelated_2 = cosine_similarity(emb2, emb3)

    print("\n--- RESULTS ---")
    print(f"Cosine Similarity (Similar Pair: Bag 1 vs Bag 2):   {sim_similar:.4f}")
    print(f"Cosine Similarity (Unrelated: Bag 1 vs Red Bottle): {sim_unrelated_1:.4f}")
    print(f"Cosine Similarity (Unrelated: Bag 2 vs Red Bottle): {sim_unrelated_2:.4f}")
    print(f"Margin (Similar vs Unrelated Avg):                  {sim_similar - (sim_unrelated_1 + sim_unrelated_2) / 2:+.4f}")

    assert sim_similar > sim_unrelated_1, "Failure: Similar pair did not score higher than unrelated 1!"
    assert sim_similar > sim_unrelated_2, "Failure: Similar pair did not score higher than unrelated 2!"
    assert sim_similar > 0.70, f"Failure: Expected similar pair similarity > 0.70, got {sim_similar:.4f}"
    
    print("\n>>> SANITY TEST PASSED: Similar pair scored meaningfully higher! <<<")
    print("==================================================")


if __name__ == "__main__":
    main()
