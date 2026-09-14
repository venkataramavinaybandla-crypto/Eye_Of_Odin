import { useState, useRef, useEffect } from "react";
import { createReport, uploadImage } from "../api";
import { IconArrowLeft, IconUpload, IconX } from "../icons";
import CustomSelect from "./CustomSelect";

const CATEGORIES = [
  { value: "bag", label: "Bag" },
  { value: "electronics", label: "Electronics" },
  { value: "id_card", label: "ID Card" },
  { value: "bottle", label: "Bottle" },
  { value: "keys", label: "Keys" },
  { value: "clothing", label: "Clothing" },
  { value: "book", label: "Book" },
  { value: "other", label: "Other" },
];

const LOCATION_ZONES = [
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

const INITIAL_FORM = {
  category: "bag",
  other_item_name: "",
  color: "",
  location_zone: "Engineering Block",
  description: "",
  type: "lost",
};

export default function ReportForm({ formType, onSubmitted, onBack, onToast }) {
  const [form, setForm] = useState({ ...INITIAL_FORM, type: formType || "lost" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const toggleContainerRef = useRef(null);
  const toggleBtnRefs = useRef({});
  const [toggleIndicator, setToggleIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    function updateToggleIndicator() {
      const target = toggleBtnRefs.current[form.type];
      const container = toggleContainerRef.current;
      if (target && container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        setToggleIndicator({
          left: targetRect.left - containerRect.left,
          width: targetRect.width,
          ready: true,
        });
      }
    }
    updateToggleIndicator();
    window.addEventListener("resize", updateToggleIndicator);
    return () => window.removeEventListener("resize", updateToggleIndicator);
  }, [form.type]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectField(name, val) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  function handleTypeToggle(type) {
    setForm((prev) => ({ ...prev, type }));
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleImagePick(e) {
    handleFile(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function clearImage(e) {
    if (e) e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.color.trim()) {
      onToast("Color is required.", "error");
      return;
    }
    if (form.category === "other" && !form.other_item_name.trim()) {
      onToast("Please specify the item name for 'Other'.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formattedDesc =
        form.category === "other" && form.other_item_name.trim()
          ? `[${form.other_item_name.trim()}] ${form.description.trim()}`.trim()
          : form.description.trim() || null;

      const report = await createReport({
        category: form.category,
        color: form.color.trim(),
        location_zone: form.location_zone,
        description: formattedDesc,
        type: form.type,
      });

      if (imageFile) {
        await uploadImage(report.id, imageFile);
      }

      onToast(
        `Report #${report.id} created successfully.`,
        "success"
      );
      setForm({ ...INITIAL_FORM, type: formType || "lost" });
      clearImage();
      onSubmitted();
    } catch (err) {
      onToast(err.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-view">
      <div className="container">
        <button className="back-btn" type="button" onClick={onBack}>
          <IconArrowLeft />
          Back
        </button>

        <div className="form-header">
          <h2>
            {form.type === "lost" ? "Report a Lost Item" : "Report a Found Item"}
          </h2>
          <p>Provide as much detail as possible to help identify the item.</p>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Type toggle with physical traveling indicator */}
            <div className="form-group">
              <label>Type</label>
              <div className="type-toggle" ref={toggleContainerRef}>
                <span
                  className={`traveling-toggle-indicator ${toggleIndicator.ready ? "visible" : ""}`}
                  style={{
                    transform: `translate3d(${toggleIndicator.left}px, 0, 0)`,
                    width: `${toggleIndicator.width}px`,
                  }}
                  aria-hidden="true"
                />
                <button
                  ref={(el) => (toggleBtnRefs.current["lost"] = el)}
                  type="button"
                  className={form.type === "lost" ? "selected" : ""}
                  onClick={() => handleTypeToggle("lost")}
                >
                  Lost
                </button>
                <button
                  ref={(el) => (toggleBtnRefs.current["found"] = el)}
                  type="button"
                  className={form.type === "found" ? "selected" : ""}
                  onClick={() => handleTypeToggle("found")}
                >
                  Found
                </button>
              </div>
            </div>

            {/* Category Custom Dropdown */}
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <CustomSelect
                id="category"
                value={form.category}
                onChange={(val) => handleSelectField("category", val)}
                options={CATEGORIES}
                placeholder="Select category"
                aria-label="Item Category"
              />
            </div>

            {/* Special Input Section when Category is Other */}
            {form.category === "other" && (
              <div className="form-group other-name-group">
                <label htmlFor="other_item_name">
                  Item Name <span className="field-required-star">*</span>
                </label>
                <input
                  id="other_item_name"
                  name="other_item_name"
                  type="text"
                  placeholder="e.g. Casio Watch, Tennis Racket, Umbrella..."
                  value={form.other_item_name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Color */}
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                id="color"
                name="color"
                type="text"
                placeholder="Black, Red, Silver..."
                value={form.color}
                onChange={handleChange}
              />
            </div>

            {/* Location Zone Custom Dropdown */}
            <div className="form-group">
              <label htmlFor="location_zone">Location Zone</label>
              <CustomSelect
                id="location_zone"
                value={form.location_zone}
                onChange={(val) => handleSelectField("location_zone", val)}
                options={LOCATION_ZONES}
                placeholder="Select location zone"
                aria-label="Location Zone"
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Brand, distinguishing marks, exact location, time of day..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* Image upload drop zone — Zero raw file input UI */}
            <div className="form-group full-width">
              <label>Photo</label>
              <div
                className={`image-drop-zone ${imageFile ? "has-file" : ""} ${dragging ? "dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {/* Fully hidden native file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  style={{ display: "none" }}
                  aria-hidden="true"
                />

                {imageFile ? (
                  <div className="file-chip-container">
                    {imagePreview && (
                      <img src={imagePreview} alt="Asset preview" className="file-chip-preview" />
                    )}
                    <div className="file-chip-info">
                      <span className="file-chip-name">{imageFile.name}</span>
                      <span className="file-chip-size">
                        {(imageFile.size / 1024).toFixed(1)} KB · Ready to attach
                      </span>
                    </div>
                    <button
                      type="button"
                      className="file-chip-remove"
                      onClick={clearImage}
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <IconX />
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <IconUpload className="drop-zone-icon" />
                    <p className="drop-zone-text">
                      <strong>Click to upload</strong> or drag and drop
                    </p>
                    <span className="drop-zone-subtext">PNG, JPG, WEBP, GIF up to 10MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit button with contained smoky plume and deep rich green */}
            <button type="submit" className="submit-btn" disabled={submitting}>
              <span className="submit-btn-text">
                {submitting ? "Submitting..." : "Submit Report"}
              </span>
              <span className="submit-btn-glow" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
