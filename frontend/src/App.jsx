import { useState, useEffect } from "react";
import AmbientBackground from "./components/AmbientBackground";
import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BrowseView from "./components/BrowseView";
import ReportForm from "./components/ReportForm";
import ItemDetailModal from "./components/ItemDetailModal";
import MatchesView from "./components/MatchesView";
import Footer from "./components/Footer";

export default function App() {
  const [activeView, setActiveView] = useState("overview"); // "overview" | "browse" | "form" | "matches"
  const [formInitialType, setFormInitialType] = useState("lost");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedMatchReport, setSelectedMatchReport] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSelectEntryPath(type) {
    setFormInitialType(type);
    setActiveView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormSubmitted() {
    showToast("Incident report successfully logged to campus registry.", "success");
    setActiveView("browse");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNavigate(section) {
    if (section === "overview") {
      setActiveView("overview");
    } else if (section === "browse") {
      setActiveView("browse");
    } else if (section === "form") {
      setFormInitialType("lost");
      setActiveView("form");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleViewMatches(report) {
    setSelectedMatchReport(report);
    setActiveView("matches");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBackFromMatches() {
    setSelectedMatchReport(null);
    setActiveView("browse");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      {/* Liquid Trailing Custom Cursor */}
      <CustomCursor />

      {/* Continuous Atmospheric Ambient Background Motion */}
      <AmbientBackground />

      {/* Top Floating Glass Navbar */}
      <Navbar
        activeSection={activeView}
        onNavigate={handleNavigate}
      />

      {/* Main View Transition Area with Staggered Rise+Fade */}
      <main className="main-content">
        {activeView === "overview" && (
          <div className="page-transition">
            <Hero onSelectEntryPath={handleSelectEntryPath} />
            <BrowseView
              onOpenModalPreview={() => setIsModalOpen(true)}
              onViewMatches={handleViewMatches}
            />
          </div>
        )}

        {activeView === "browse" && (
          <div className="page-transition">
            <BrowseView
              onOpenModalPreview={() => setIsModalOpen(true)}
              onViewMatches={handleViewMatches}
            />
          </div>
        )}

        {activeView === "form" && (
          <div className="page-transition">
            <ReportForm
              formType={formInitialType}
              onSubmitted={handleFormSubmitted}
              onBack={() => setActiveView("overview")}
              onToast={showToast}
            />
          </div>
        )}

        {activeView === "matches" && selectedMatchReport && (
          <div className="page-transition">
            <MatchesView
              sourceReport={selectedMatchReport}
              onBack={handleBackFromMatches}
              onToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Structural Item Detail Modal / Drawer Demonstrator */}
      <ItemDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Minimal Footer */}
      <Footer />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

