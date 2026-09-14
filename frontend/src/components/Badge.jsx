export default function Badge({ type, label, className = "" }) {
  if (!type && !label) return null;
  const normalized = (type || label || "").toLowerCase();
  const displayLabel = label || normalized;

  return (
    <span className={`badge badge-${normalized} ${className}`}>
      {displayLabel}
    </span>
  );
}
