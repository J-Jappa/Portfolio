// Client-side hero widget: the solar car's CFD surface mesh rendered as a
// slowly orbiting three.js x-ray wireframe (transparent background, line
// colour follows the site accent). Geometry comes pre-baked from
// src/assets/models/solar-car-geo.js (regenerate with scripts/gen-car-geo.mjs)
// and is decimated at mount time, the underside much harder than the rest.
//
// This module is heavy (three.js + baked mesh), so the page dynamic-imports
// it only once the hero container is actually visible.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import { GROUPS, type BakedGeometry } from "../assets/models/solar-car-geo.js";

// Decimation strength per region (fraction of vertices removed)
const DEC_TOP = 0.5;
const DEC_BOTTOM = 0.86;
const DEC_WHEEL = 0.41;

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function decodeGeometry(data: BakedGeometry): THREE.BufferGeometry {
  const positions = new Float32Array(b64ToBuf(data.pos));
  const indices = data.u32
    ? new Uint32Array(b64ToBuf(data.idx))
    : new Uint16Array(b64ToBuf(data.idx));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  return g;
}

const simplifier = new SimplifyModifier();
function decimate(
  geom: THREE.BufferGeometry,
  ratio: number
): THREE.BufferGeometry {
  const remove = Math.floor(geom.attributes.position.count * ratio);
  try {
    const out = simplifier.modify(geom, remove);
    if (out && out.attributes.position && out.attributes.position.count > 3) {
      return out;
    }
  } catch (e) {
    console.warn("decimation failed, using full res", e);
  }
  return geom;
}

export function mountHeroCar(container: HTMLElement): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Renderer (transparent background) ─────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.01,
    100
  );
  camera.position.set(4.2, 2.4, 5.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.06;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.55; // slow
  controls.enablePan = false;
  // Wheel zoom would hijack page scrolling inside a hero card
  controls.enableZoom = false;
  // Keep the orbit near the horizon, matching the old renderer's pitch
  // clamp: a little below level up to a moderate look-down angle.
  controls.minPolarAngle = Math.PI / 2 - 0.74;
  controls.maxPolarAngle = Math.PI / 2 + 0.16;
  controls.target.set(0, 0, 0);
  controls.update();

  // ── Line colour follows the site accent token ──────────────────────
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  function applyAccent() {
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    if (accent) wireMat.color.set(accent);
  }
  applyAccent();
  const themeObs = new MutationObserver(() => {
    applyAccent();
    if (reduced) renderOnce();
  });
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // ── Decode baked geometry (x-ray view: body + wheel treads) ────────
  const gTop = decodeGeometry(GROUPS.top);
  const gBot = decodeGeometry(GROUPS.bottom);
  const gWheel = decodeGeometry(GROUPS.wheelTread);

  // Shared centre + normalised scale across the whole car
  const box = new THREE.Box3();
  for (const g of [gTop, gBot, gWheel]) {
    g.computeBoundingBox();
    box.union(g.boundingBox!);
  }
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const s = 6.3 / Math.max(size.x, size.y, size.z);
  for (const g of [gTop, gBot, gWheel]) {
    g.translate(-center.x, -center.y, -center.z);
    g.scale(s, s, s);
  }

  // Decimate each region, the underside of the pods much harder
  const topDec = decimate(gTop, DEC_TOP);
  const botDec = decimate(gBot, DEC_BOTTOM);
  const wheelDec = decimate(gWheel, DEC_WHEEL);

  const root = new THREE.Group();
  root.name = "SC4-Monty";
  const wires: THREE.LineSegments[] = [];
  for (const g of [topDec, botDec, wheelDec]) {
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(g),
      wireMat
    );
    wires.push(wire);
    root.add(wire);
  }
  scene.add(root);

  // ── Render loop, gated on visibility ───────────────────────────────
  let raf = 0;
  let visible = false;
  const renderOnce = () => renderer.render(scene, camera);
  function loop() {
    if (!visible) return;
    controls.update();
    renderOnce();
    raf = requestAnimationFrame(loop);
  }
  const io = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    cancelAnimationFrame(raf);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  });
  io.observe(container);

  if (reduced) {
    // Static frame; re-render only when the user drags or the theme flips
    controls.addEventListener("change", renderOnce);
  }
  renderOnce();

  // Cursor feedback while orbiting
  renderer.domElement.style.cursor = "grab";
  const onDown = () => (renderer.domElement.style.cursor = "grabbing");
  const onUp = () => (renderer.domElement.style.cursor = "grab");
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  // ── Resize with the container ──────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderOnce();
  });
  ro.observe(container);

  // ── Cleanup (called before re-mounting after view transitions) ─────
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    themeObs.disconnect();
    controls.dispose();
    for (const wire of wires) wire.geometry.dispose();
    for (const g of [gTop, gBot, gWheel, topDec, botDec, wheelDec]) {
      g.dispose();
    }
    wireMat.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
