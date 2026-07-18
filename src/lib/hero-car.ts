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

// ── Intro: reorder wireframe edges into a growth sequence ────────────────
// BFS from a couple of random seed edges, spreading across shared vertices,
// so that drawing the first N edge pairs reads as traces linking outward
// until the car is complete. Disconnected patches of the mesh (the model
// has a few) seed their own growth front. Jitter keeps the wave organic.
function growthOrdered(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const src = geo.attributes.position.array as Float32Array;
  const edges = src.length / 6;
  const keyOf = (v: number) => {
    const o = v * 3;
    return (
      Math.round(src[o] * 1000) +
      ":" +
      Math.round(src[o + 1] * 1000) +
      ":" +
      Math.round(src[o + 2] * 1000)
    );
  };
  const byVertex = new Map<string, number[]>();
  for (let e = 0; e < edges; e++) {
    for (const v of [2 * e, 2 * e + 1]) {
      const k = keyOf(v);
      const list = byVertex.get(k);
      if (list) list.push(e);
      else byVertex.set(k, [e]);
    }
  }
  const depth = new Float32Array(edges).fill(-1);
  const queue: number[] = [];
  const seed = (e: number) => {
    if (depth[e] < 0) {
      depth[e] = 0;
      queue.push(e);
    }
  };
  seed(Math.floor(Math.random() * edges));
  seed(Math.floor(Math.random() * edges));
  let head = 0;
  let processed = 0;
  while (processed < edges) {
    if (head >= queue.length) {
      for (let e = 0; e < edges; e++) {
        if (depth[e] < 0) {
          seed(e);
          break;
        }
      }
    }
    const e = queue[head++];
    processed++;
    for (const v of [2 * e, 2 * e + 1]) {
      for (const n of byVertex.get(keyOf(v)) ?? []) {
        if (depth[n] < 0) {
          depth[n] = depth[e] + 1;
          queue.push(n);
        }
      }
    }
  }
  const activation = new Float32Array(edges);
  for (let e = 0; e < edges; e++) activation[e] = depth[e] + Math.random() * 1.5;
  const order = Array.from({ length: edges }, (_, e) => e).sort(
    (a, b) => activation[a] - activation[b]
  );
  const out = new Float32Array(src.length);
  order.forEach((e, i) => out.set(src.subarray(e * 6, e * 6 + 6), i * 6));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(out, 3));
  geo.dispose();
  return g;
}

export type HeroCarOpts = {
  /** Play the construct-the-car intro animation on mount */
  intro?: boolean;
};

export function mountHeroCar(
  container: HTMLElement,
  opts: HeroCarOpts = {}
): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Renderer (transparent background) ─────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const FOV = 38;
  const camera = new THREE.PerspectiveCamera(
    FOV,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.01,
    100
  );
  camera.position.set(4.2, 2.4, 5.6);

  // The default distance is tuned for the ~1.5 aspect of the desktop hero.
  // On narrower canvases (phone-width embeds) the horizontal field shrinks
  // and the car's nose/tail clip while it rotates, so dolly the camera out
  // just enough to keep the same horizontal span in frame.
  const BASE_DIST = camera.position.length();
  const BASE_ASPECT = 1.5;
  const halfWidthTan = (aspect: number) =>
    Math.tan((FOV / 2) * (Math.PI / 180)) * aspect;
  function frameDistance() {
    const d =
      camera.aspect >= BASE_ASPECT
        ? BASE_DIST
        : (BASE_DIST * halfWidthTan(BASE_ASPECT)) / halfWidthTan(camera.aspect);
    camera.position.setLength(d);
  }
  frameDistance();

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
  const introOn = !!opts.intro && !reduced;
  const wires: THREE.LineSegments[] = [];
  const fronts: THREE.LineSegments[] = [];
  const edgeTotals: number[] = [];
  // Brighter material for the newest edges, so the growth front reads as
  // live traces linking up rather than lines quietly appearing.
  const frontMat = introOn
    ? new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      })
    : null;
  for (const g of [topDec, botDec, wheelDec]) {
    let wgeo: THREE.BufferGeometry = new THREE.WireframeGeometry(g);
    if (introOn) wgeo = growthOrdered(wgeo);
    const wire = new THREE.LineSegments(wgeo, wireMat);
    wires.push(wire);
    root.add(wire);
    if (introOn && frontMat) {
      edgeTotals.push(wgeo.attributes.position.count / 2);
      wgeo.setDrawRange(0, 0);
      const fg = new THREE.BufferGeometry();
      fg.setAttribute("position", wgeo.attributes.position);
      fg.setDrawRange(0, 0);
      const front = new THREE.LineSegments(fg, frontMat);
      fronts.push(front);
      root.add(front);
    }
  }
  scene.add(root);

  // ── Intro playback: reveal edges in growth order over a fixed run ──
  const INTRO_MS = 2500;
  let introElapsed = 0;
  let introDone = !introOn;
  // Hold the start until the canvas is properly on screen; on phones the
  // hero sits below the intro text, and starting at first paint meant the
  // build finished before anyone scrolled to it.
  let introArmed = false;
  function updateIntro(dt: number) {
    if (introDone || !introArmed) return;
    frontMat?.color.copy(wireMat.color); // follow the theme accent
    introElapsed += dt;
    const t = Math.min(1, introElapsed / INTRO_MS);
    const p = t * t * (3 - 2 * t); // smoothstep
    wires.forEach((w, i) => {
      const total = edgeTotals[i];
      const vis = Math.floor(total * p);
      w.geometry.setDrawRange(0, vis * 2);
      const win = Math.max(24, Math.floor(total * 0.05));
      const start = Math.max(0, vis - win);
      fronts[i]?.geometry.setDrawRange(start * 2, (vis - start) * 2);
    });
    if (t >= 1) {
      introDone = true;
      wires.forEach(w => w.geometry.setDrawRange(0, Infinity));
      fronts.forEach(f => {
        root.remove(f);
        // position attribute is shared with the base wire; only the front's
        // material is uniquely ours to free
      });
      fronts.length = 0;
      frontMat?.dispose();
    }
  }

  // ── Render loop, gated on visibility ───────────────────────────────
  let raf = 0;
  let visible = false;
  let lastFrame = 0;
  const renderOnce = () => renderer.render(scene, camera);
  function loop() {
    if (!visible) return;
    const now = performance.now();
    const dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
    lastFrame = now;
    updateIntro(dt);
    controls.update();
    renderOnce();
    raf = requestAnimationFrame(loop);
  }
  const io = new IntersectionObserver(
    entries => {
      const e = entries[0];
      visible = e?.isIntersecting ?? false;
      if ((e?.intersectionRatio ?? 0) >= 0.85) introArmed = true;
      cancelAnimationFrame(raf);
      lastFrame = 0; // avoid a huge dt after being scrolled away
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    },
    { threshold: [0, 0.85] }
  );
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
    frameDistance();
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
    frontMat?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
