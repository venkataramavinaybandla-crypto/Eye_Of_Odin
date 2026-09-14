import { useRef, useState, useEffect } from "react";
import { IconBrandEye } from "../icons";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "browse", label: "Registry Index" },
  { id: "form", label: "File Report" },
];

export default function Navbar({ activeSection, onNavigate, matchCount = 0 }) {
  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    function updateIndicator() {
      const targetBtn = buttonRefs.current[activeSection];
      const container = containerRef.current;
      if (targetBtn && container) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = targetBtn.getBoundingClientRect();
        setIndicatorStyle({
          left: btnRect.left - containerRect.left,
          width: btnRect.width,
          ready: true,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, ready: false }));
      }
    }

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeSection]);

  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["overview", "browse", "form"].includes(hash)) {
        onNavigate(hash);
      }
    }
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [onNavigate]);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <button
          type="button"
          className="nav-brand"
          onClick={() => onNavigate("overview")}
          aria-label="Eye of Odin Home"
        >
          <div className="brand-mark">
            <IconBrandEye />
          </div>
          <span className="brand-text">Eye of Odin</span>
        </button>

        <div className="nav-controls">
          <nav className="nav-links" ref={containerRef} aria-label="Main Navigation">
            {/* Physically traveling indicator across sections */}
            <span
              className={`traveling-indicator ${indicatorStyle.ready ? "visible" : ""}`}
              style={{
                transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
                width: `${indicatorStyle.width}px`,
              }}
              aria-hidden="true"
            />

            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                ref={(el) => (buttonRefs.current[item.id] = el)}
                type="button"
                className={`nav-link ${activeSection === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span>{item.label}</span>
                {item.id === "browse" && matchCount > 0 && (
                  <span className="nav-match-indicator">
                    {matchCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
