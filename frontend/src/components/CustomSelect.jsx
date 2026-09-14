import { useState, useRef, useEffect } from "react";
import { CategoryBevelIcon } from "../icons";

const KNOWN_CATEGORIES = new Set([
  "bag",
  "electronics",
  "id_card",
  "bottle",
  "keys",
  "clothing",
  "book",
  "other",
]);

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  id,
  "aria-label": ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  function handleSelect(val) {
    onChange(val);
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }

  const isSelectedCategory = selectedOption && KNOWN_CATEGORIES.has(selectedOption.value);

  return (
    <div
      className={`custom-select-container ${isOpen ? "is-open" : ""}`}
      ref={containerRef}
      id={id}
      // --- Z-INDEX FIX -------------------------------------------------
      // Forces this container above sibling content (cards, filter chips)
      // whenever the dropdown is open, regardless of any external CSS
      // stacking-context bugs. `position: relative` is required for
      // z-index to have any effect here.
      style={{
        position: "relative",
        zIndex: isOpen ? 9999 : 1,
      }}
    // -------------------------------------------------------------
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
      >
        <div className="custom-select-value-group">
          {isSelectedCategory && (
            <CategoryBevelIcon category={selectedOption.value} className="select-bevel-icon" />
          )}
          <span className={`custom-select-value ${!selectedOption ? "placeholder" : ""}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className="custom-select-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Unfurling Floating Glass Dropdown Panel */}
      <div
        className={`custom-select-panel floating-glass-panel ${isOpen ? "open" : ""}`}
        role="listbox"
        // --- Z-INDEX FIX -------------------------------------------------
        // Belt-and-suspenders: the panel itself also gets an explicit
        // absolute position + high z-index, so it always paints above
        // the card grid / quick-filter row even if a parent element
        // elsewhere on the page has its own conflicting stacking context.
        style={{
          position: "absolute",
          zIndex: 9999,
        }}
      // -------------------------------------------------------------
      >
        <div className="custom-select-scroll">
          {options.map((option) => {
            const isSelected = option.value === value;
            const isOptionCategory = KNOWN_CATEGORIES.has(option.value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={`custom-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.value);
                  }
                }}
              >
                <div className="option-content">
                  {isOptionCategory && (
                    <CategoryBevelIcon category={option.value} className="select-bevel-icon" />
                  )}
                  <span className="option-label">{option.label}</span>
                </div>
                {isSelected && (
                  <span className="option-indicator" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
