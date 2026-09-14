import os
import math
from typing import List, Union, Optional
from PIL import Image
import torch

_model = None
_processor = None
MODEL_NAME = "openai/clip-vit-base-patch32"


def get_clip():
    """Lazy-load the CLIP model and processor on CPU."""
    global _model, _processor
    if _model is None or _processor is None:
        from transformers import CLIPProcessor, CLIPModel
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model = CLIPModel.from_pretrained(MODEL_NAME)
        _model.eval()
    return _model, _processor


def embed_image(image_input: Union[str, Image.Image]) -> List[float]:
    """Given an image path or PIL Image, return its normalized 512-dim CLIP embedding vector."""
    if isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image not found at path: {image_input}")
        with Image.open(image_input) as raw_img:
            img = raw_img.convert("RGB")
    else:
        img = image_input.convert("RGB")

    model, processor = get_clip()
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        if hasattr(features, "pooler_output") and features.pooler_output is not None:
            features = features.pooler_output
        # Normalize to unit sphere for cosine distance
        norm = features.norm(p=2, dim=-1, keepdim=True)
        norm = torch.clamp(norm, min=1e-12)
        normalized = features / norm
    
    return normalized.squeeze(0).cpu().tolist()


def embed_text(text: str) -> List[float]:
    """Given a text string, return its normalized 512-dim CLIP text embedding vector."""
    if not text or not text.strip():
        return []

    model, processor = get_clip()
    inputs = processor(text=[text.strip()], return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        features = model.get_text_features(**inputs)
        if hasattr(features, "pooler_output") and features.pooler_output is not None:
            features = features.pooler_output
        norm = features.norm(p=2, dim=-1, keepdim=True)
        norm = torch.clamp(norm, min=1e-12)
        normalized = features / norm

    return normalized.squeeze(0).cpu().tolist()


def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> float:
    """Compute cosine similarity between two unit-normalized float vectors."""
    if not vec_a or not vec_b:
        return 0.0
    if len(vec_a) != len(vec_b):
        return 0.0

    # Dot product of already L2-normalized vectors
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    # Clamp to [-1.0, 1.0] to guard against floating-point epsilon
    return max(-1.0, min(1.0, float(dot_product)))
