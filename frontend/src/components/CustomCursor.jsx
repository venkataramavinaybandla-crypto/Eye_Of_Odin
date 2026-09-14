import { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    function onMouseMove(e) {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    }

    function onMouseDown() {
      setIsPressed(true);
    }

    function onMouseUp() {
      setIsPressed(false);
    }

    function onMouseLeave() {
      setVisible(false);
    }

    function checkInteractiveHover(e) {
      const target = e.target;
      if (
        target.closest(
          "button, a, .entry-card, .custom-select-trigger, .custom-select-option, .image-drop-zone, input, textarea, .file-chip-remove"
        )
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousemove", checkInteractiveHover, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);

    // Liquid motion loop: primary dot tracks tight, ring trails smoothly with syrup inertia
    let frameId;
    function renderLoop() {
      // Dot follows with quick lerp
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.35;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.35;

      // Ring trails with liquid slow syrup drag (0.12)
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      frameId = requestAnimationFrame(renderLoop);
    }

    frameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousemove", checkInteractiveHover);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="custom-cursor-layer" aria-hidden="true">
      {/* Precision core dot */}
      <div
        ref={dotRef}
        className={`cursor-dot ${isHovering ? "hovering" : ""} ${isPressed ? "pressed" : ""}`}
      />
      {/* Liquid trailing frosted ring */}
      <div
        ref={ringRef}
        className={`cursor-ring ${isHovering ? "hovering" : ""} ${isPressed ? "pressed" : ""}`}
      />
    </div>
  );
}
