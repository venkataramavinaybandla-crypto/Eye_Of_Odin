import os
import json
import shutil
import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, get_db, init_db
import models
from schemas import ReportCreate, ReportResponse, TypeEnum

logger = logging.getLogger(__name__)

# Initialize tables
init_db()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Eye of Odin - Lost & Found Item Tracker",
    description="Campus Lost & Found Tracker Backend API",
    version="0.2.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_valid_image(header: bytes) -> bool:
    """Validate image magic bytes for JPEG, PNG, GIF, WEBP, and BMP."""
    if len(header) < 4:
        return False
    # JPEG
    if header.startswith(b"\xff\xd8\xff"):
        return True
    # PNG
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    # GIF
    if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        return True
    # WEBP
    if header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP":
        return True
    # BMP
    if header.startswith(b"BM"):
        return True
    return False


def _compute_and_store_embedding(report: models.Report, db: Session):
    """Compute CLIP image embedding for a report and persist it."""
    if not report.image_path:
        return
    abs_path = os.path.join(os.path.dirname(__file__), report.image_path.replace("/", os.sep))
    if not os.path.exists(abs_path):
        logger.warning("Image file not found for embedding: %s", abs_path)
        return
    try:
        from embedding import embed_image, embed_text
        img_vec = embed_image(abs_path)
        # Also compute text embedding from description if available
        text_vec = embed_text(report.description or "") if report.description else []
        payload = {"image": img_vec}
        if text_vec:
            payload["text"] = text_vec
        report.embedding = json.dumps(payload)
        db.commit()
        db.refresh(report)
        logger.info("Stored embedding for report %d (img=%d dims, txt=%d dims)",
                     report.id, len(img_vec), len(text_vec))
    except Exception:
        logger.exception("Failed to compute embedding for report %d", report.id)


def _get_embedding_vectors(report: models.Report):
    """Parse stored embedding JSON, returns (image_vec, text_vec) or (None, None)."""
    if not report.embedding:
        return None, None
    try:
        data = json.loads(report.embedding)
        if isinstance(data, dict):
            return data.get("image"), data.get("text")
        # Legacy: plain list = image embedding only
        if isinstance(data, list):
            return data, None
    except (json.JSONDecodeError, TypeError):
        pass
    return None, None


# ---------------------------------------------------------------------------
# Match confidence fusion
# ---------------------------------------------------------------------------

# Weights documentation:
#   image_sim:     0.50  (CLIP visual similarity — primary signal)
#   text_sim:      0.20  (CLIP text description similarity)
#   category_match: 0.15 (exact category match: 1.0 or 0.0)
#   color_match:    0.15 (exact color match: 1.0 or 0.0)
#
# When image embeddings are unavailable for either side, image_sim weight
# redistributes to text_sim (+0.20) and metadata (+0.15 each).
# When text embeddings are unavailable, text_sim weight redistributes to
# image_sim (+0.10) and metadata (+0.05 each).

def _compute_confidence(source: models.Report, candidate: models.Report) -> dict:
    """Compute multi-signal confidence score between two reports.
    Returns dict with score (0-100), breakdown signals, and raw values."""
    from embedding import cosine_similarity

    src_img, src_txt = _get_embedding_vectors(source)
    cand_img, cand_txt = _get_embedding_vectors(candidate)

    # Raw signal computation
    image_sim = cosine_similarity(src_img, cand_img) if (src_img and cand_img) else 0.0
    text_sim = cosine_similarity(src_txt, cand_txt) if (src_txt and cand_txt) else 0.0

    category_match = 1.0 if (source.category and candidate.category and
                             source.category.lower() == candidate.category.lower()) else 0.0
    color_match = 1.0 if (source.color and candidate.color and
                          source.color.lower() == candidate.color.lower()) else 0.0
    zone_match = 1.0 if (source.location_zone and candidate.location_zone and
                         source.location_zone.lower() == candidate.location_zone.lower()) else 0.0

    # Determine which signals are available
    has_image = bool(src_img and cand_img)
    has_text = bool(src_txt and cand_txt)

    # Dynamic weight assignment
    if has_image and has_text:
        w_img, w_txt, w_cat, w_col = 0.50, 0.20, 0.15, 0.15
    elif has_image and not has_text:
        # No text → redistribute text weight
        w_img, w_txt, w_cat, w_col = 0.60, 0.00, 0.20, 0.20
    elif not has_image and has_text:
        # No image → redistribute image weight
        w_img, w_txt, w_cat, w_col = 0.00, 0.40, 0.30, 0.30
    else:
        # Neither image nor text embeddings — metadata only
        w_img, w_txt, w_cat, w_col = 0.00, 0.00, 0.50, 0.50

    raw_score = (w_img * image_sim +
                 w_txt * text_sim +
                 w_cat * category_match +
                 w_col * color_match)

    # Clamp and convert to 0-100 integer percentage
    confidence = max(0, min(100, int(round(raw_score * 100))))

    return {
        "confidence": confidence,
        "image_sim": round(image_sim, 4),
        "text_sim": round(text_sim, 4),
        "category_match": bool(category_match),
        "color_match": bool(color_match),
        "zone_match": bool(zone_match),
        "weights_used": {"image": w_img, "text": w_txt, "category": w_cat, "color": w_col},
    }


# ---------------------------------------------------------------------------
# Schemas for new endpoints
# ---------------------------------------------------------------------------

class MatchResult(BaseModel):
    id: int
    confidence: int
    image_sim: float
    text_sim: float
    category_match: bool
    color_match: bool
    zone_match: bool
    category: str
    color: str
    location_zone: str
    description: Optional[str] = None
    image_path: Optional[str] = None
    type: str
    status: str


class ResolvePairRequest(BaseModel):
    report_id_a: int
    report_id_b: int


class ResolvePairResponse(BaseModel):
    report_a: ReportResponse
    report_b: ReportResponse
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lost or found report"
)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db)
):
    report_data = report_in.model_dump(exclude_unset=True)
    
    # Ensure category, location_zone, type, status values are string values
    report_data["category"] = report_in.category.value
    report_data["location_zone"] = report_in.location_zone.value
    report_data["type"] = report_in.type.value
    if "status" in report_data and report_in.status:
        report_data["status"] = report_in.status.value
    else:
        report_data["status"] = "open"

    db_report = models.Report(**report_data)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@app.get(
    "/reports",
    response_model=List[ReportResponse],
    summary="List all reports with optional type filtering"
)
def list_reports(
    type: Optional[TypeEnum] = Query(None, description="Filter by report type ('lost' or 'found')"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Report)
    if type is not None:
        query = query.filter(models.Report.type == type.value)
    reports = query.order_by(models.Report.id.desc()).all()
    return reports


@app.get(
    "/reports/{id}",
    response_model=ReportResponse,
    summary="Fetch a single report by ID"
)
def get_report(
    id: int,
    db: Session = Depends(get_db)
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id {id} not found"
        )
    return report


@app.post(
    "/reports/{id}/image",
    response_model=ReportResponse,
    summary="Upload and attach an image to an existing report"
)
def upload_report_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id {id} not found"
        )

    # Validate image magic bytes
    header = file.file.read(32)
    file.file.seek(0)
    if not is_valid_image(header):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file format. Only JPEG, PNG, GIF, WEBP, and BMP are supported."
        )

    # If an old image exists on disk, clean it up before replacing
    if report.image_path:
        old_file_path = os.path.join(os.path.dirname(__file__), report.image_path.replace("/", os.sep))
        if os.path.exists(old_file_path) and os.path.isfile(old_file_path):
            try:
                os.remove(old_file_path)
            except OSError:
                pass

    # Sanitize and construct filename
    original_filename = os.path.basename(file.filename or "item.jpg")
    saved_filename = f"{id}_{original_filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update database record (relative path suitable for web serving)
    relative_path = f"uploads/{saved_filename}"
    report.image_path = relative_path
    db.commit()
    db.refresh(report)

    # Automatically compute and store CLIP embedding
    _compute_and_store_embedding(report, db)

    return report


@app.get(
    "/reports/{id}/matches",
    response_model=List[MatchResult],
    summary="Find possible matching reports of the opposite type, ranked by confidence"
)
def get_matches(
    id: int,
    db: Session = Depends(get_db)
):
    """For a given report, compute similarity against every OPPOSITE-type report
    that has an embedding, and return a ranked list sorted by confidence descending."""
    source = db.query(models.Report).filter(models.Report.id == id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id {id} not found"
        )

    # Determine opposite type
    opposite_type = "found" if source.type == "lost" else "lost"

    # Fetch candidate reports of opposite type
    candidates = (
        db.query(models.Report)
        .filter(models.Report.type == opposite_type)
        .filter(models.Report.status == "open")
        .all()
    )

    results = []
    for cand in candidates:
        scores = _compute_confidence(source, cand)
        results.append(MatchResult(
            id=cand.id,
            confidence=scores["confidence"],
            image_sim=scores["image_sim"],
            text_sim=scores["text_sim"],
            category_match=scores["category_match"],
            color_match=scores["color_match"],
            zone_match=scores["zone_match"],
            category=cand.category or "",
            color=cand.color or "",
            location_zone=cand.location_zone or "",
            description=cand.description,
            image_path=cand.image_path,
            type=cand.type,
            status=cand.status,
        ))

    # Sort by confidence descending
    results.sort(key=lambda r: r.confidence, reverse=True)
    return results


@app.post(
    "/reports/resolve-pair",
    response_model=ResolvePairResponse,
    summary="Mark both reports in a confirmed match pair as resolved"
)
def resolve_pair(
    body: ResolvePairRequest,
    db: Session = Depends(get_db)
):
    report_a = db.query(models.Report).filter(models.Report.id == body.report_id_a).first()
    report_b = db.query(models.Report).filter(models.Report.id == body.report_id_b).first()

    if not report_a:
        raise HTTPException(status_code=404, detail=f"Report {body.report_id_a} not found")
    if not report_b:
        raise HTTPException(status_code=404, detail=f"Report {body.report_id_b} not found")

    report_a.status = "resolved"
    report_b.status = "resolved"
    db.commit()
    db.refresh(report_a)
    db.refresh(report_b)

    return ResolvePairResponse(
        report_a=report_a,
        report_b=report_b,
        message=f"Reports {body.report_id_a} and {body.report_id_b} resolved as a confirmed match."
    )


@app.patch(
    "/reports/{id}/status",
    response_model=ReportResponse,
    summary="Update a report's status"
)
def update_report_status(
    id: int,
    new_status: str = Query(..., description="New status value ('open' or 'resolved')"),
    db: Session = Depends(get_db)
):
    if new_status not in ("open", "resolved"):
        raise HTTPException(status_code=400, detail="Status must be 'open' or 'resolved'")
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {id} not found")
    report.status = new_status
    db.commit()
    db.refresh(report)
    return report
