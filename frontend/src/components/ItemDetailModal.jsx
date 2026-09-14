import { useEffect } from "react";
import { IconX, CategoryBevelIcon, IconMapPin, IconPalette, IconCalendar, IconCheck } from "../icons";
import { formatLastSeen } from "./ReportCard";

export default function ItemDetailModal({ isOpen, onClose, report, item }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const target = report || item;
  const zone = target?.location_zone || "Designated Campus Zone";
  const ts = target?.timestamp || (target ? null : new Date());
  const lastSeenText = formatLastSeen(zone, ts);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel floating-glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Visual asset frame */}
        <div className="modal-image-placeholder">
          <CategoryBevelIcon category="bag" className="modal-bevel-icon" />
          <span className="modal-placeholder-label">Visual Asset Frame</span>
        </div>

        <div className="modal-body">
          <div className="modal-top-row">
            <div>
              <span className="modal-type-indicator">Schema Layout Preview</span>
              <h3 className="modal-title">Item Detail Specification</h3>
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Close dialog">
              <IconX />
            </button>
          </div>

          <div className="modal-badges">
            <span className="badge badge-lost">Type: Lost</span>
            <span className="badge badge-found">Type: Found</span>
            <span className="badge badge-open">Status: Open</span>
          </div>

          <div className="modal-meta-grid">
            <div className="modal-meta-item">
              <span className="modal-meta-label">
                <CategoryBevelIcon category="bag" className="meta-icon-mini" /> Category
              </span>
              <span className="modal-meta-value">Selected Category Spec</span>
            </div>

            <div className="modal-meta-item">
              <span className="modal-meta-label">
                <IconPalette /> Color
              </span>
              <span className="modal-meta-value">Color Parameter</span>
            </div>

            <div className="modal-meta-item">
              <span className="modal-meta-label">
                <IconMapPin /> Location Zone
              </span>
              <span className="modal-meta-value">Designated Campus Zone</span>
            </div>

            <div className="modal-meta-item">
              <span className="modal-meta-label">
                <IconCalendar /> Timestamp
              </span>
              <span className="modal-meta-value">ISO-8601 Temporal Stamp</span>
            </div>
          </div>

          {/* Last Seen Phrasing */}
          {lastSeenText && (
            <div
              className="modal-last-seen"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary, #94a3b8)",
                marginTop: "12px",
                marginBottom: "4px",
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span>{lastSeenText}</span>
            </div>
          )}

          <div className="modal-section">
            <span className="modal-meta-label">Description Field</span>
            <p className="modal-description">
              Full item narrative, unique identifiers, and situational context rendered as recorded in the report schema.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Dismiss Preview
            </button>
            {/* Primary Action Button in Deep-Green CTA treatment */}
            <button type="button" className="modal-confirm-btn" onClick={onClose}>
              <IconCheck className="confirm-icon" />
              <span>Confirm Specification</span>
              <span className="cta-contained-shimmer" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
