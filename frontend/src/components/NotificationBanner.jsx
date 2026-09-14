import { useState } from "react";
import Badge from "./Badge";

export default function NotificationBanner({
  matches = [],
  onViewMatches,
  onFilterMatched,
  isFilteringMatched = false,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !matches || matches.length === 0) {
    return null;
  }

  const count = matches.length;
  const primaryItem = matches[0];

  return (
    <div
      className="notification-banner floating-glass-panel"
      role="region"
      aria-label="High-confidence match alert"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px 18px",
        marginBottom: "18px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 18px -2px rgba(16, 185, 129, 0.18)",
        backdropFilter: "blur(12px)",
        color: "#f8fafc",
        animation: "fadeIn 0.35s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Pulsing signal indicator */}
          <span
            style={{
              display: "inline-flex",
              position: "relative",
              width: "10px",
              height: "10px",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "#10b981",
                opacity: 0.75,
                animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
          </span>

          {/* Banner message */}
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "#ecfdf5" }}>
              {count} {count === 1 ? "report has" : "reports have"} high-confidence matches (&gt;80%)
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "#94a3b8",
                marginTop: "2px",
              }}
            >
              Top match: Report #{primaryItem.report.id} ({primaryItem.report.category || "Item"}) with{" "}
              <strong style={{ color: "#34d399" }}>{primaryItem.topMatch.confidence}%</strong> confidence
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onFilterMatched && (
            <button
              type="button"
              onClick={onFilterMatched}
              style={{
                fontSize: "0.78rem",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: isFilteringMatched ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                color: isFilteringMatched ? "#34d399" : "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Filter registry to reports with high-confidence matches"
            >
              {isFilteringMatched ? "Show All Items" : "Highlight Matched"}
            </button>
          )}

          {onViewMatches && (
            <button
              type="button"
              onClick={() => onViewMatches(primaryItem.report)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.5)",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
              title={`View match analysis for Report #${primaryItem.report.id}`}
            >
              <span>Review Matches</span>
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
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss notification"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick navigation chips for all matched items */}
      {matches.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            paddingTop: "6px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Quick Review:</span>
          {matches.map(({ report, topMatch }) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onViewMatches?.(report)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.72rem",
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#a7f3d0",
                cursor: "pointer",
              }}
              title={`Inspect Report #${report.id} matches`}
            >
              <span>#{report.id} {report.category}</span>
              <span style={{ fontWeight: 600, color: "#34d399" }}>
                {topMatch.confidence}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
