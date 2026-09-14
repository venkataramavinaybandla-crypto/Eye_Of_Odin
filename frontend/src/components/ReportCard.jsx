import { useState, useEffect } from "react";
import { imageUrl } from "../api";
import { CategoryBevelIcon } from "../icons";
import Badge from "./Badge";

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLastSeen(locationZone, timestamp) {
  let timeStr = "";
  if (timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeFormatted = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (isToday) {
        timeStr = timeFormatted;
      } else {
        const dateFormatted = d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
        timeStr = `${dateFormatted}, ${timeFormatted}`;
      }
    }
  }

  if (locationZone && timeStr) {
    return `Last seen at ${locationZone}, ${timeStr}`;
  } else if (locationZone) {
    return `Last seen at ${locationZone}`;
  } else if (timeStr) {
    return `Last seen ${timeStr}`;
  }
  return "";
}

export default function ReportCard({
  report,
  headerSlot,
  footerSlot,
  onFindMatches,
  layout = "card", // "card" | "row"
  className = "",
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imageUrl(report?.image_path);

  // Reset img error if image_path changes
  useEffect(() => {
    setImgError(false);
  }, [report?.image_path]);

  if (!report) return null;

  // Extract custom item name if category is other and description has [Item Name]
  let displayCategory = report.category ? report.category.replace("_", " ") : "Item";
  let cleanDescription = report.description || "";
  const otherNameMatch = report.description?.match(/^\[(.*?)\]\s*(.*)/s);
  if (otherNameMatch && report.category === "other") {
    displayCategory = `Other (${otherNameMatch[1]})`;
    cleanDescription = otherNameMatch[2];
  }

  const isResolved = report.status === "resolved";
  const lastSeen = formatLastSeen(report.location_zone, report.timestamp);

  return (
    <article
      className={`report-card floating-glass-panel layout-${layout} ${
        isResolved ? "status-resolved" : ""
      } ${className}`}
    >
      {/* Fixed aspect-ratio image container */}
      <div className="report-card-media">
        {imgSrc && !imgError ? (
          <img
            className="report-card-img"
            src={imgSrc}
            alt={`${displayCategory} - ${report.color || ""}`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="report-card-placeholder" aria-label="No image provided">
            <CategoryBevelIcon
              category={report.category}
              className="report-card-fallback-icon"
            />
          </div>
        )}

        {/* Optional header slot (e.g. Rank #1, ConfidenceBadge) */}
        {headerSlot && <div className="report-card-header-slot">{headerSlot}</div>}
      </div>

      {/* Content-sized card body with no empty void */}
      <div className="report-card-body">
        {/* Top category & badges line */}
        <div className="report-card-top">
          <div className="report-card-category-group">
            <CategoryBevelIcon
              category={report.category}
              className="report-card-category-icon"
            />
            <span className="report-card-category-text">{displayCategory}</span>
          </div>

          <div className="report-card-badges">
            <Badge type={report.type} />
            <Badge type={report.status} />
          </div>
        </div>

        {/* Structured metadata */}
        <div className="report-card-meta">
          {report.color && (
            <span className="meta-item">
              <span className="meta-dot" aria-hidden="true" />
              {report.color}
            </span>
          )}
          {report.location_zone && (
            <span className="meta-item">
              <span className="meta-dot" aria-hidden="true" />
              {report.location_zone}
            </span>
          )}
          {report.timestamp && (
            <span className="meta-item meta-date">
              <span className="meta-dot" aria-hidden="true" />
              {formatDate(report.timestamp)}
            </span>
          )}
        </div>

        {/* Last Seen Phrasing */}
        {lastSeen && (
          <div className="report-card-last-seen">
            {lastSeen}
          </div>
        )}

        {/* Description snippet */}
        {cleanDescription && (
          <p className="report-card-desc">{cleanDescription}</p>
        )}

        {/* Custom footer slot or default actions */}
        {footerSlot ? (
          <div className="report-card-footer">{footerSlot}</div>
        ) : (
          <>
            {report.status === "open" && onFindMatches && (
              <div className="report-card-footer">
                <button
                  type="button"
                  className="find-matches-btn"
                  onClick={() => onFindMatches(report)}
                  aria-label={`Find matches for report #${report.id}`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Find Matches</span>
                </button>
              </div>
            )}

            {isResolved && (
              <div className="report-card-footer">
                <div className="card-resolved-badge">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Resolved</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
