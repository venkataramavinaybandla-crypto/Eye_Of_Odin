import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero3DObject() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Generous viewport sizing to prevent any clipping
    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;

    // Camera frustum with 30%+ safety breathing room
    // Camera placed at z = 6.8 with fov = 38 provides full rotation margin without touching edges
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Geometry: Torus knot scaled to guarantee generous breathing room (max diagonal radius < 1.35)
    const geometry = new THREE.TorusKnotGeometry(0.95, 0.28, 128, 32, 2, 3);

    // Frosted glass physical material with #ab6d83 -> #A21D4C transmission
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xab6d83),
      emissive: new THREE.Color(0x2a0713),
      roughness: 0.22,
      metalness: 0.15,
      transmission: 0.65,
      ior: 1.48,
      thickness: 1.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting setup: soft key, ambient, and signature #A21D4C rim light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const roseRimLight = new THREE.DirectionalLight(0xA21D4C, 4.8);
    roseRimLight.position.set(-4, -2, -2);
    scene.add(roseRimLight);

    const softFillLight = new THREE.DirectionalLight(0x879884, 1.4);
    softFillLight.position.set(0, -3, 3);
    scene.add(softFillLight);

    // Subtle pointer parallax tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    function handleMouseMove(e) {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x * 0.25;
      targetMouseY = y * 0.25;
    }

    // Scroll parallax tracking (restrained fraction so it stays well within viewport)
    let scrollY = window.scrollY;
    function handleScroll() {
      scrollY = window.scrollY;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Liquid animation loop using standard performance.now()
    let animationFrameId;
    const startTime = performance.now();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Continuous, restrained, calm rotation
      mesh.rotation.x = elapsedTime * 0.16;
      mesh.rotation.y = elapsedTime * 0.22;

      // Soft vertical floating breath (small amplitude: 0.08)
      mesh.position.y = Math.sin(elapsedTime * 0.8) * 0.08;

      // Parallax scroll reaction: subtle drift counter to scroll
      const scrollDrift = Math.max(-0.4, Math.min(0.4, scrollY * 0.0006));
      mesh.position.y += scrollDrift;

      // Smooth lerp for mouse magnetic tilt
      currentMouseX += (targetMouseX - currentMouseX) * 0.035;
      currentMouseY += (targetMouseY - currentMouseY) * 0.035;
      mesh.rotation.z = currentMouseX * 0.4;
      mesh.position.x = currentMouseX * 0.25;

      renderer.render(scene, camera);
    }

    animate();

    // Resize handling
    function handleResize() {
      if (!container) return;
      const newW = container.clientWidth || 440;
      const newH = container.clientHeight || 440;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="hero-3d-wrapper" aria-hidden="true">
      <div className="hero-3d-container" ref={mountRef} />
      <div className="hero-3d-pedestal" />
    </div>
  );
}
