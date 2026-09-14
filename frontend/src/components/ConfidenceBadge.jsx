export default function ConfidenceBadge({ confidence, className = "" }) {
  const confVal = typeof confidence === "number" ? confidence : parseInt(confidence, 10) || 0;

  let tier = "low";
  let tierLabel = "Weak Match";

  if (confVal > 80) {
    tier = "high";
    tierLabel = "Strong Match";
  } else if (confVal >= 50) {
    tier = "medium";
    tierLabel = "Possible Match";
  }

  return (
    <div className={`confidence-badge confidence-${tier} ${className}`}>
      <span className="confidence-value">{confVal}%</span>
      <span className="confidence-label">{tierLabel}</span>
    </div>
  );
}
