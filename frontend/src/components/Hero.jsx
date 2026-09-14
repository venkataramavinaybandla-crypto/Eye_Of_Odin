import { IconSearch, IconCheck } from "../icons";
import Hero3DObject from "./Hero3DObject";

export default function Hero({ onSelectEntryPath }) {
  return (
    <section className="hero">
      <div className="container">
        {/* Subtle WebGL 3D Frosted Glass Element */}
        <Hero3DObject />

        <div className="hero-content">
          <span className="hero-eyebrow stagger-1">Campus Asset Custody &amp; Recovery</span>
          <h1 className="hero-title stagger-2">
            EYE OF ODIN
          </h1>
          <p className="hero-subtitle stagger-3">
            A unified, systematic registry for lost and found property across all academic, residential, and recreational campus zones.
          </p>
        </div>

        {/* Symmetrical Entry Paths as Floating Glass Panels */}
        <div className="entry-paths stagger-4">
          <button
            type="button"
            className="entry-card entry-card-lost floating-glass-panel"
            onClick={() => onSelectEntryPath("lost")}
          >
            <div className="entry-card-header">
              <div className="entry-icon-wrap entry-icon-lost">
                <IconSearch className="entry-card-icon" />
              </div>
              <span className="entry-badge">Report Incident</span>
            </div>
            <h2 className="entry-card-title">Report Lost Item</h2>
            <p className="entry-card-desc">
              Log missing personal property into the registry to initiate matching across campus zones.
            </p>
            <div className="entry-card-action">
              <span className="entry-action-link">Open Lost Form</span>
            </div>
          </button>

          <button
            type="button"
            className="entry-card entry-card-found floating-glass-panel"
            onClick={() => onSelectEntryPath("found")}
          >
            <div className="entry-card-header">
              <div className="entry-icon-wrap entry-icon-found">
                <IconCheck className="entry-card-icon" />
              </div>
              <span className="entry-badge">Report Custody</span>
            </div>
            <h2 className="entry-card-title">Report Found Item</h2>
            <p className="entry-card-desc">
              Catalog items recovered across campus grounds to facilitate prompt owner restoration.
            </p>
            <div className="entry-card-action">
              <span className="entry-action-link">Open Found Form</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
