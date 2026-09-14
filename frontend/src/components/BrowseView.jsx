import { useState, useRef, useEffect } from "react";
import { IconEmptyMark, IconList, IconSearch, CategoryBevelIcon } from "../icons";
import { fetchReports, fetchMatches } from "../api";
import CustomSelect from "./CustomSelect";
import ReportCard from "./ReportCard";
import NotificationBanner from "./NotificationBanner";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "bag", label: "Bag" },
  { value: "electronics", label: "Electronics" },
  { value: "id_card", label: "ID Card" },
  { value: "bottle", label: "Bottle" },
  { value: "keys", label: "Keys" },
  { value: "clothing", label: "Clothing" },
  { value: "book", label: "Book" },
  { value: "other", label: "Other" },
];

const QUICK_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "bag", label: "Bag" },
  { value: "electronics", label: "Electronics" },
  { value: "id_card", label: "ID Card" },
  { value: "bottle", label: "Bottle" },
  { value: "keys", label: "Keys" },
  { value: "clothing", label: "Clothing" },
  { value: "book", label: "Book" },
];

const LOCATION_ZONES = [
  { value: "all", label: "All Location Zones" },
  { value: "Engineering Block", label: "Engineering Block" },
  { value: "Library", label: "Library" },
  { value: "Cafeteria", label: "Cafeteria" },
  { value: "Hostel A", label: "Hostel A" },
  { value: "Hostel B", label: "Hostel B" },
  { value: "Sports Complex", label: "Sports Complex" },
  { value: "Main Gate", label: "Main Gate" },
  { value: "Admin Block", label: "Admin Block" },
  { value: "Auditorium", label: "Auditorium" },
  { value: "Other", label: "Other" },
];

const TYPE_OPTIONS = [
  { id: "all", label: "All Records" },
  { id: "lost", label: "Lost Items" },
  { id: "found", label: "Found Items" },
];

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BrowseView({ onOpenModalPreview, onViewMatches }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [isApplying, setIsApplying] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highConfidenceMatches, setHighConfidenceMatches] = useState([]);
  const [filterMatchedOnly, setFilterMatchedOnly] = useState(false);

  const clusterRef = useRef(null);
  const pillRefs = useRef({});
  const [pillIndicator, setPillIndicator] = useState({ left: 0, width: 0, ready: false });

  // Fetch reports on mount and when type filter changes
  useEffect(() => {
    loadReports();
  }, [typeFilter]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await fetchReports(typeFilter);
      setReports(data);
      // Immediately render reports without blocking UI
      setLoading(false);
      // Asynchronously inspect high-confidence matches in background
      checkMatchesBackground(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setLoading(false);
    }
  }

  async function checkMatchesBackground(reportsList) {
    // Only inspect open reports, capped at first 8 to keep network requests lightweight
    const openReports = reportsList.filter((r) => r.status === "open").slice(0, 8);
    if (openReports.length === 0) {
      setHighConfidenceMatches([]);
      return;
    }

    try {
      const results = await Promise.allSettled(
        openReports.map(async (r) => {
          const matches = await fetchMatches(r.id);
          const topMatch = matches?.find((m) => m.confidence > 80);
          if (topMatch) {
            return { report: r, topMatch };
          }
          return null;
        })
      );

      const foundHighConf = results
        .filter((res) => res.status === "fulfilled" && res.value !== null)
        .map((res) => res.value);

      setHighConfidenceMatches(foundHighConf);
    } catch (err) {
      console.warn("Background match check skipped:", err);
    }
  }

  useEffect(() => {
    function updatePillIndicator() {
      const targetPill = pillRefs.current[typeFilter];
      const cluster = clusterRef.current;
      if (targetPill && cluster) {
        const clusterRect = cluster.getBoundingClientRect();
        const pillRect = targetPill.getBoundingClientRect();
        setPillIndicator({
          left: pillRect.left - clusterRect.left,
          width: pillRect.width,
          ready: true,
        });
      }
    }

    updatePillIndicator();
    window.addEventListener("resize", updatePillIndicator);
    return () => window.removeEventListener("resize", updatePillIndicator);
  }, [typeFilter]);

  function handleApplyFilters() {
    setIsApplying(true);
    loadReports();
    setTimeout(() => setIsApplying(false), 450);
  }

  function handleReset() {
    setTypeFilter("all");
    setCategoryFilter("all");
    setZoneFilter("all");
    setFilterMatchedOnly(false);
  }

  const isFiltered = typeFilter !== "all" || categoryFilter !== "all" || zoneFilter !== "all" || filterMatchedOnly;

  // Client-side filtering for category and zone (type is server-side)
  const filteredReports = reports.filter((r) => {
    if (filterMatchedOnly) {
      const isMatched = highConfidenceMatches.some((m) => m.report.id === r.id);
      if (!isMatched) return false;
    }
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (zoneFilter !== "all" && r.location_zone !== zoneFilter) return false;
    return true;
  });

  return (
    <section className="browse-view">
      <div className="container">
        <div className="browse-header">
          <div className="browse-title-group">
            <span className="section-eyebrow">Registry Index</span>
            <h2 className="section-heading">Browse Campus Inventory</h2>
          </div>
          
          <button
            type="button"
            className="preview-trigger-btn"
            onClick={onOpenModalPreview}
            title="Inspect structural detail drawer specification"
          >
            <IconList />
            <span>Detail Modal Specification</span>
          </button>
        </div>

        {/* In-App High-Confidence Match Notification Banner */}
        <NotificationBanner
          matches={highConfidenceMatches}
          onViewMatches={onViewMatches}
          onFilterMatched={() => setFilterMatchedOnly((prev) => !prev)}
          isFilteringMatched={filterMatchedOnly}
        />

        {/* Filter Bar with Custom Selects, Traveling Indicator & Green Action CTA */}
        <div className="filter-bar floating-glass-panel">
          <div className="filter-group-primary">
            <div className="filter-pill-cluster" ref={clusterRef} role="tablist" aria-label="Type filter">
              {/* Traveling sliding pill indicator */}
              <span
                className={`traveling-pill-indicator ${pillIndicator.ready ? "visible" : ""}`}
                style={{
                  transform: `translate3d(${pillIndicator.left}px, 0, 0)`,
                  width: `${pillIndicator.width}px`,
                }}
                aria-hidden="true"
              />

              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  ref={(el) => (pillRefs.current[opt.id] = el)}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === opt.id}
                  className={`filter-pill ${typeFilter === opt.id ? "active" : ""}`}
                  onClick={() => setTypeFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group-secondary">
            <div className="select-filter-wrapper">
              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={CATEGORIES}
                placeholder="Category"
                aria-label="Filter by category"
              />
            </div>

            <div className="select-filter-wrapper">
              <CustomSelect
                value={zoneFilter}
                onChange={setZoneFilter}
                options={LOCATION_ZONES}
                placeholder="Location Zone"
                aria-label="Filter by location zone"
              />
            </div>

            {/* Primary Action Button: Apply Filter in deep-green treatment */}
            <button
              type="button"
              className={`filter-action-btn ${isApplying ? "is-applying" : ""}`}
              onClick={handleApplyFilters}
              title="Apply active search and zone filters"
            >
              <IconSearch className="filter-btn-icon" />
              <span>{isApplying ? "Filtering..." : "Apply Filters"}</span>
              <span className="cta-contained-shimmer" aria-hidden="true" />
            </button>

            {isFiltered && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={handleReset}
                title="Reset all filters to default"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Filter Chips with Green Hover & Selected State */}
        <div className="category-chips-row" role="region" aria-label="Quick category filters">
          <span className="chips-label">Quick Filter:</span>
          <div className="chips-list">
            {QUICK_CATEGORIES.map((cat) => {
              const isSelected = categoryFilter === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.value !== "all" && (
                    <CategoryBevelIcon category={cat.value} className="chip-bevel-icon" />
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Line with Green Signal */}
        <div className="filter-status-bar">
          <span className="filter-status-count">
            <span className="status-signal-green" aria-hidden="true" />
            {filteredReports.length} active record{filteredReports.length !== 1 ? "s" : ""} in current view
          </span>
          <span className="filter-status-meta">
            Scope: {typeFilter.toUpperCase()} | Category: {categoryFilter.toUpperCase()} | Zone: {zoneFilter}
          </span>
        </div>

        {/* Reports Grid */}
        {loading && (
          <div className="matches-loading">
            <div className="matches-spinner" />
            <span>Loading reports...</span>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onFindMatches={onViewMatches}
              />
            ))}
          </div>
        )}

        {/* Genuine Empty State Shell with Green Signals */}
        {!loading && filteredReports.length === 0 && (
          <div className="empty-state-shell floating-glass-panel">
            <div className="empty-state-card">
              <div className="empty-mark-container">
                <IconEmptyMark className="empty-state-mark" />
              </div>
              <h3 className="empty-state-title">No reports currently logged</h3>
              <p className="empty-state-text">
                The campus lost and found registry is clear. Submitted reports will display here automatically once indexed.
              </p>
              <div className="empty-state-signals">
                <span className="empty-signal">
                  <span className="status-dot-green" /> Schema: Ready
                </span>
                <span className="empty-signal-divider">/</span>
                <span className="empty-signal">
                  <span className="status-dot-green" /> Zone Index: Active
                </span>
                <span className="empty-signal-divider">/</span>
                <span className="empty-signal">
                  <span className="status-dot-green" /> Filter Query: Synced
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

