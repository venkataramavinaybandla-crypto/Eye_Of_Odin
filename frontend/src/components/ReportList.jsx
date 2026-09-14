import { useState, useEffect, useCallback } from "react";
import { fetchReports } from "../api";
import ReportCard from "./ReportCard";

export default function ReportList({ refreshKey }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "lost" | "found"
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReports(filter);
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Reload when filter changes OR when parent signals a refresh
  useEffect(() => {
    loadReports();
  }, [loadReports, refreshKey]);

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-toggles">
          <button
            className={filter === "all" ? "active-all" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "lost" ? "active-lost" : ""}
            onClick={() => setFilter("lost")}
          >
            🔍 Lost
          </button>
          <button
            className={filter === "found" ? "active-found" : ""}
            onClick={() => setFilter("found")}
          >
            ✅ Found
          </button>
        </div>
        <span className="report-count">
          {loading ? "Loading..." : `${reports.length} report${reports.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Reports grid */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No {filter !== "all" ? filter : ""} reports found.</p>
        </div>
      ) : (
        <div className="report-grid">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
