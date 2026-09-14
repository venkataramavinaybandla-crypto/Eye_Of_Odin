// Thin-line custom SVG icons with consistent 1.5px stroke weight
// + Tactile soft 3D beveled category icons (subtle depth cues, zero clipart)

export function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMapPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconPalette(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconPackage(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function IconList(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

// Empty state decorative mark — abstract compass/eye motif
export function IconEmptyMark(props) {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="40" cy="40" r="30" />
      <circle cx="40" cy="40" r="18" />
      <circle cx="40" cy="40" r="6" />
      <line x1="40" y1="4" x2="40" y2="10" />
      <line x1="40" y1="70" x2="40" y2="76" />
      <line x1="4" y1="40" x2="10" y2="40" />
      <line x1="70" y1="40" x2="76" y2="40" />
    </svg>
  );
}

// Eye of Odin brand mark for nav
export function IconBrandEye(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Soft 3D-Beveled Tactile Category Icon Component
export function CategoryBevelIcon({ category, className = "category-bevel-icon" }) {
  const bevelFilterId = `bevel-${category}`;

  const renderShape = () => {
    switch (category) {
      case "bag":
        return (
          <>
            <path d="M6 9h12v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9z" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M10 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );
      case "electronics":
        return (
          <>
            <rect x="3" y="5" width="18" height="12" rx="2" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 19h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12" y2="19" stroke="currentColor" strokeWidth="1.2" />
          </>
        );
      case "id_card":
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="3" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 16c0-2 1.8-3 4-3s4 1 4 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );
      case "bottle":
        return (
          <>
            <path d="M9 3h6v2H9z" fill="currentColor" opacity="0.8" />
            <path d="M10 5v3l-3 4v8a2 2 0 002 2h6a2 2 0 002-2v-8l-3-4V5z" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
          </>
        );
      case "keys":
        return (
          <>
            <circle cx="8" cy="14" r="4" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11 11l8-8m-2 2l2 2m-4 0l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </>
        );
      case "clothing":
        return (
          <>
            <path d="M7 4L3 8l3 3 2-2v9h8V9l2 2 3-3-4-4-3 2a3 3 0 01-4 0L7 4z" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </>
        );
      case "book":
        return (
          <>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" />
          </>
        );
      default:
        return (
          <>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" fill="url(#grad-bevel)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="20 7.5 12 12 4 7.5" stroke="currentColor" strokeWidth="1.2" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35)) drop-shadow(0 1px 1px rgba(255,255,255,0.08))",
      }}
    >
      <defs>
        <linearGradient id="grad-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.18)" />
          <stop offset="60%" stopColor="rgba(171, 109, 131, 0.12)" />
          <stop offset="100%" stopColor="rgba(162, 29, 76, 0.22)" />
        </linearGradient>
      </defs>
      {renderShape()}
    </svg>
  );
}
