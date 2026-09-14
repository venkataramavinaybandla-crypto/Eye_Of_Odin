import { useState, useEffect } from "react";
import { fetchMatches, resolveMatchPair } from "../api";
import ConfidenceBadge from "./ConfidenceBadge";
import ReportCard, { formatLastSeen } from "./ReportCard";

function SignalTag({ label, active }) {
  return (
    <span className={`signal-tag ${active ? "signal-active" : "signal-inactive"}`}>
      {label}
    </span>
  );
}

export default function MatchesView({ sourceReport, onBack, onToast }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolvedIds, setResolvedIds] = useState(new Set());

  useEffect(() => {
    if (!sourceReport?.id) return;
    setLoading(true);
    setError(null);
    fetchMatches(sourceReport.id)
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sourceReport?.id]);

  async function handleConfirmMatch(candidateId) {
    setResolvingId(candidateId);
    try {
      await resolveMatchPair(sourceReport.id, candidateId);
      setResolvedIds((prev) => new Set([...prev, candidateId]));
      onToast?.("Match confirmed — both reports marked as resolved.", "success");
    } catch (err) {
      onToast?.(`Failed to resolve match: ${err.message}`, "error");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <section className="matches-view">
      <div className="container">
        {/* Back navigation */}
        <button type="button" className="matches-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Registry</span>
        </button>

        <div className="matches-header">
          <span className="section-eyebrow">Match Analysis</span>
          <h2 className="section-heading">Possible Matches</h2>
        </div>

        {/* Source report summary using unified ReportCard with row layout */}
        {sourceReport && (
          <div className="source-report-wrapper">
            <div className="source-report-banner-label">
              <span>Source Incident Profile</span>
              <span className="source-report-id">#{sourceReport.id}</span>
            </div>
            <ReportCard
              report={{
                ...sourceReport,
                status: resolvedIds.size > 0 ? "resolved" : sourceReport.status,
              }}
              layout="row"
              className="source-report-card"
            />
          </div>
        )}

        {/* Loading / Error states */}
        {loading && (
          <div className="matches-loading">
            <div className="matches-spinner" />
            <span>Computing similarity vectors and ranking candidates...</span>
          </div>
        )}

        {error && (
          <div className="matches-error floating-glass-panel">
            <p>Error loading matches: {error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && matches.length === 0 && (
          <div className="matches-empty floating-glass-panel">
            <h3>No candidate matches found</h3>
            <p>
              There are no open opposite-type reports matching this criteria yet.
              Candidates will automatically appear here once more inventory records are filed.
            </p>
          </div>
        )}

        {/* Candidate matches grid using unified ReportCard */}
        {!loading && !error && matches.length > 0 && (
          <>
            <div className="matches-count">
              <span className="status-signal-green" aria-hidden="true" />
              <span>{matches.length} candidate{matches.length !== 1 ? "s" : ""} ranked by multi-modal confidence</span>
            </div>

            <div className="matches-grid">
              {matches.map((match, idx) => {
                const isResolved = resolvedIds.has(match.id);
                const isResolving = resolvingId === match.id;

                return (
                  <ReportCard
                    key={match.id}
                    report={{
                      ...match,
                      timestamp: match.timestamp || sourceReport?.timestamp,
                      status: isResolved ? "resolved" : match.status,
                    }}
                    className={`match-candidate-card ${isResolved ? "match-resolved" : ""}`}
                    headerSlot={
                      <div className="match-card-header-slot">
                        <span className="match-card-rank">#{idx + 1}</span>
                        <ConfidenceBadge confidence={match.confidence} />
                      </div>
                    }
                    footerSlot={
                      <div className="match-card-footer-content">
                        {/* Last Seen Phrasing */}
                        <div className="match-last-seen">
                          {formatLastSeen(
                            match.location_zone,
                            match.timestamp || sourceReport?.timestamp
                          )}
                        </div>

                        {/* Signal breakdown tags */}
                        <div className="match-signals">
                          <SignalTag label={`Image: ${(match.image_sim * 100).toFixed(0)}%`} active={match.image_sim > 0.5} />
                          <SignalTag label={`Text: ${(match.text_sim * 100).toFixed(0)}%`} active={match.text_sim > 0.5} />
                          <SignalTag label="Category" active={match.category_match} />
                          <SignalTag label="Color" active={match.color_match} />
                          <SignalTag label="Zone" active={match.zone_match} />
                        </div>

                        {/* Confirm match button */}
                        <div className="match-card-actions">
                          {isResolved ? (
                            <div className="match-resolved-badge">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Match Confirmed</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="confirm-match-btn"
                              onClick={() => handleConfirmMatch(match.id)}
                              disabled={isResolving || resolvedIds.size > 0}
                            >
                              {isResolving ? (
                                <>
                                  <span className="btn-spinner" />
                                  <span>Resolving...</span>
                                </>
                              ) : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Confirm Match</span>
                                </>
                              )}
                              <span className="cta-contained-shimmer" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
