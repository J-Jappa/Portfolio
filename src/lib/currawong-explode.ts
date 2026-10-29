// Client-side exploded view of Currawong: the per-part CAD export rendered as
// a three.js x-ray wireframe (same look as the Monty hero). It draws itself
// in (the Monty intro) when the stage comes into view, standing upright and
// facing the reader; scrolling then tips it back to lie face-up and takes it
// apart layer by layer. Fully apart, it can be dragged round to look at;
// scrolling back up swings it home first, then closes it up. Once it has drawn in, the display plays the device's
// own boot animation on its glass and holds the end frame, riding along with
// the display as it explodes. Geometry and animation are baked by
// scripts/gen-currawong-geo.mjs into src/assets/models/currawong-geo.js.
//
// Heavy (three.js + baked edges), so the component dynamic-imports this only
// once the track is near the viewport.

import * as THREE from "three";
import * as BAKED from "../assets/models/currawong-geo.js";
import type { ExplodeGroup } from "../assets/models/currawong-geo.js";

// ── Tuning knobs ─────────────────────────────────────────────────────────
// Scroll timeline (fractions of the pinned scroll distance):
//   0 → TILT_START       upright, facing the reader
//   TILT_START → TILT_END tips back to lie face-up
//   HOLD_START → HOLD_END comes apart, then holds fully exploded
const TILT_START = 0.03;
const TILT_END = 0.26;
const HOLD_START = 0.28;
const HOLD_END = 0.88;
// Each group's move takes this share of the explode phase; the rest is the
// stagger, outermost layers first.
const MOVE_SHARE = 0.5;
// Explode spread multiplier on the baked dz/dx offsets
const SPREAD = 1;
// Camera: elevation above the horizon and the yaw sweep across the explode.
// Yaw -π/2 looks straight down the long side from the dial end, so tipping
// back sends the display end away from the reader; the offsets turn that
// into a three-quarter view.
const ELEVATION = 0.5; // rad
const YAW_FROM = -Math.PI / 2 + 0.75; // rad, as the explode starts
const YAW_TO = -Math.PI / 2 + 0.35; // rad, fully exploded
// Portrait stages (phones): open the stack further to use the height
const PORTRAIT_SPREAD = 1.3;
// Intro: edges grow outward along the mesh, Monty style (ms)
const INTRO_MS = 2600;
// How much of the stage must be on screen before the intro starts
const INTRO_ARM_RATIO = 0.6;
// Boot animation on the display glass: pause after the intro, ink opacity
const BOOT_DELAY_MS = 350;
const SCREEN_OPACITY = 0.9;
// Dark backing behind the ink so wireframe behind the glass doesn't fight it
// (page background colour at this opacity, fades in as the screen boots)
const SCREEN_BACKING = 0.8;
// Corner radius of the screen (model mm), and segments per corner
const SCREEN_RADIUS = 1.6;
const SCREEN_CORNER_SEGMENTS = 6;
const FOV = 30;
// Breathing room around the model when framing (1 = touching the edges)
const FIT_MARGIN = 1.18;
// Line opacity: dense electronics read quieter than the printed shells
const OPACITY: Record<string, number> = {
  default: 0.5,
  pcb: 0.34,
  encoder: 0.3,
  motor: 0.4,
  usb: 0.36,
  standoffs: 0.32,
  pi: 0.34,
  gauge: 0.34,
  xiao: 0.34,
  boost: 0.34,
  screwsFront: 0.42,
  screwsBack: 0.42,
  screwsBoard: 0.42,
};
// Drag to turn, once fully exploded: radians per pixel, pitch range around
// ELEVATION, how quickly a flick spins down, and how fast it swings home
// when you scroll back up (ms time constant)
const ORBIT_SPEED = 0.008;
const ORBIT_PITCH_MIN = -0.45;
const ORBIT_PITCH_MAX = 0.9;
const ORBIT_FRICTION = 0.92;
const ORBIT_RETURN_MS = 140;
// Damping on the displayed progress (0..1 per frame); 1 = locked to scroll
const DAMPING = 0.14;
// World size of the assembled device's longest side (Monty uses 6.3)
const WORLD_SIZE = 6.3;

export type CurrawongExplodeOpts = {
  /** Element whose scroll position drives the explode (the tall track) */
  track: HTMLElement;
  /** Overlay root holding [data-label=<group id>] elements + an <svg> for leaders */
  overlay?: HTMLElement | null;
  /** Element that shows the current part on narrow screens */
  ticker?: HTMLElement | null;
  /** Scrolling element, when the track scrolls inside a box rather than the page */
  scroller?: HTMLElement | null;
  /** Element whose --accent / data-theme drive the line colour (default <html>) */
  accentFrom?: HTMLElement | null;
  /** Alternative baked geometry (e.g. the all-triangle x-ray bake) */
  data?: {
    BOUNDS: typeof BAKED.BOUNDS;
    GROUPS: ExplodeGroup[];
    SCREEN?: typeof BAKED.SCREEN;
    ANIM?: typeof BAKED.ANIM;
  };
  /** Multiplier on the explode offsets */
  spread?: number;
  /** Allow dragging to turn the model once it is fully exploded (default true) */
  orbit?: boolean;
};

type Part = {
  g: ExplodeGroup;
  obj: THREE.LineSegments;
  front: THREE.LineSegments | null; // bright growth front during the intro
  count: number; // index count (2 per edge)
  mat: THREE.LineBasicMaterial;
  offset: THREE.Vector3; // full explode offset, world units
  box: THREE.Box3; // assembled bounds, world units
  samples: Float32Array; // a few hundred of its vertices, for callout anchors
  start: number; // within the explode phase
  t: number; // current eased progress 0..1
  label: HTMLElement | null;
  leader: SVGLineElement | null;
};

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Evenly strided subset of a position array (xyz triples)
function sampleVerts(p: Float32Array, n: number): Float32Array {
  const count = p.length / 3;
  const step = Math.max(1, Math.floor(count / n));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
  return new Float32Array(out);
}

// Reorder line-segment pairs into a growth sequence: BFS from a couple of
// random seed edges across shared vertices, with jitter, so drawing the first
// N pairs reads as traces linking outward. Disconnected bits seed their own
// front. (Same idea as growthOrdered() in hero-car.ts, on indexed lines.)
function growthOrder<T extends Uint16Array | Uint32Array>(idx: T, nv: number): T {
  const edges = idx.length / 2;
  const deg = new Uint32Array(nv + 1);
  for (let i = 0; i < idx.length; i++) deg[idx[i] + 1]++;
  for (let v = 0; v < nv; v++) deg[v + 1] += deg[v];
  const fill = deg.slice(0, nv);
  const adj = new Uint32Array(idx.length);
  for (let e = 0; e < edges; e++) {
    adj[fill[idx[2 * e]]++] = e;
    adj[fill[idx[2 * e + 1]]++] = e;
  }
  const depth = new Float32Array(edges).fill(-1);
  const queue = new Uint32Array(edges);
  let head = 0, tail = 0, scan = 0;
  const seed = (e: number) => {
    if (depth[e] < 0) { depth[e] = 0; queue[tail++] = e; }
  };
  seed(Math.floor(Math.random() * edges));
  seed(Math.floor(Math.random() * edges));
  while (head < edges) {
    if (head >= tail) {
      while (depth[scan] >= 0) scan++;
      seed(scan);
    }
    const e = queue[head++];
    for (const v of [idx[2 * e], idx[2 * e + 1]]) {
      for (let k = deg[v]; k < deg[v + 1]; k++) {
        const n = adj[k];
        if (depth[n] < 0) { depth[n] = depth[e] + 1; queue[tail++] = n; }
      }
    }
  }
  const act = new Float32Array(edges);
  for (let e = 0; e < edges; e++) act[e] = depth[e] + Math.random() * 1.5;
  const order = Array.from({ length: edges }, (_, e) => e).sort((a, b) => act[a] - act[b]);
  const out = new (idx.constructor as { new (n: number): T })(idx.length);
  order.forEach((e, i) => { out[2 * i] = idx[2 * e]; out[2 * i + 1] = idx[2 * e + 1]; });
  return out;
}

// zlib stream → bytes, using the browser's own inflater
async function inflate(b64: string): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  const stream = new Blob([b64ToBuf(b64)]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function mountCurrawongExplode(
  container: HTMLElement,
  opts: CurrawongExplodeOpts
): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { track, overlay, ticker, scroller } = opts;
  const data = opts.data ?? BAKED;
  const { BOUNDS, GROUPS } = data;
  const SCREEN = data.SCREEN ?? BAKED.SCREEN;
  const ANIM = data.ANIM ?? BAKED.ANIM;
  const spread = opts.spread ?? 1;
  const accentEl = opts.accentFrom ?? document.documentElement;

  // ── Renderer (transparent, the page's graph paper shows through) ────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Near plane well clear of zero: the screen backing relies on depth, and
  // the camera never comes closer than ~10 units
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200);
  // Everything hangs off one root so the stand-up / tip-back is one rotation
  // and the explode happens in the device's own frame
  const root = new THREE.Group();
  root.name = "Currawong";
  scene.add(root);
  const introOn = !reduced;
  const frontMat = introOn
    ? new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false })
    : null;

  // ── Decode groups. Model mm (X width, Y length, Z stack, +Z = front face)
  //    maps to world (Z, X, Y): the device lies face-up and the layers lift
  //    off it vertically, the long side running across the screen.
  const min = BOUNDS.min, max = BOUNDS.max;
  const centre = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const s = WORLD_SIZE / Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);

  const accentColor = new THREE.Color(0xffffff);
  const parts: Part[] = GROUPS.map(g => {
    const q = new Uint16Array(b64ToBuf(g.pos));
    const p = new Float32Array(q.length);
    for (let i = 0; i < q.length; i += 3) {
      const mx = min[0] + (q[i] / 65535) * (max[0] - min[0]);
      const my = min[1] + (q[i + 1] / 65535) * (max[1] - min[1]);
      const mz = min[2] + (q[i + 2] / 65535) * (max[2] - min[2]);
      p[i] = (my - centre[1]) * s;
      p[i + 1] = (mz - centre[2]) * s;
      p[i + 2] = (mx - centre[0]) * s;
    }
    let idx: Uint16Array | Uint32Array = g.u32 ? new Uint32Array(b64ToBuf(g.idx)) : new Uint16Array(b64ToBuf(g.idx));
    if (introOn) idx = growthOrder(idx, g.nv);
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(p, 3);
    const idxAttr = new THREE.BufferAttribute(idx, 1);
    geo.setAttribute("position", posAttr);
    geo.setIndex(idxAttr);
    geo.computeBoundingBox();
    const mat = new THREE.LineBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: OPACITY[g.id] ?? OPACITY.default,
      depthWrite: false,
    });
    const obj = new THREE.LineSegments(geo, mat);
    obj.name = g.id;
    root.add(obj);
    // Intro: hide everything until it is drawn in, plus a brighter copy of
    // the newest edges riding the growth front
    let front: THREE.LineSegments | null = null;
    if (introOn && frontMat) {
      geo.setDrawRange(0, 0);
      const fg = new THREE.BufferGeometry();
      fg.setAttribute("position", posAttr);
      fg.setIndex(idxAttr);
      fg.setDrawRange(0, 0);
      front = new THREE.LineSegments(fg, frontMat);
      obj.add(front);
    }
    return {
      g,
      obj,
      front,
      count: idx.length,
      mat,
      offset: new THREE.Vector3(0, g.dz * s * SPREAD * spread, g.dx * s * SPREAD * spread),
      box: geo.boundingBox!.clone(),
      samples: sampleVerts(p, 240),
      start: 0,
      t: 0,
      label: g.label ? overlay?.querySelector<HTMLElement>(`[data-label="${g.id}"]`) ?? null : null,
      leader: null,
    };
  });

  // Stagger: outermost layers (largest offset) leave first
  const movers = parts
    .filter(p => p.offset.lengthSq() > 0)
    .sort((a, b) => b.offset.length() - a.offset.length());
  const ranks = [...new Set(movers.map(p => Math.round(p.offset.length() * 1000)))];
  for (const p of movers) {
    const r = ranks.indexOf(Math.round(p.offset.length() * 1000));
    p.start = ranks.length > 1 ? (r / (ranks.length - 1)) * (1 - MOVE_SHARE) : 0;
  }

  // ── Boot animation surface: a quad on the display's glass, child of the
  //    display part so it rides along with the explode ─────────────────────
  type Screen = {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    back: THREE.Mesh;
    backMat: THREE.MeshBasicMaterial;
    tex: THREE.DataTexture;
    rgba: Uint8Array;
    frames: Uint8Array | null; // every frame, once inflated
    elapsed: number; // ms since playback started (negative = waiting)
    shown: number; // frame index on the texture, -1 = blank
    done: boolean;
  };
  let screen: Screen | null = null;
  const host = SCREEN && ANIM ? parts.find(p => p.g.id === SCREEN.group) : undefined;
  if (SCREEN && ANIM && host) {
    const L = (mx: number, my: number, mz: number) => [
      (my - centre[1]) * s,
      (mz - centre[2]) * s,
      (mx - centre[0]) * s,
    ];
    // Ink sits on the glass. Everything in front of it (the front case,
    // buttons, dial) draws over it; everything behind is hidden by the backing.
    const z = SCREEN.z + 0.05;
    const [x0, y0] = SCREEN.min, [x1, y1] = SCREEN.max;
    // Rounded rectangle, fanned from its centre. Image row 0 is the top of
    // the screen (+length end), column 0 the left (-width side) from the front.
    const r = Math.min(SCREEN_RADIUS, (x1 - x0) / 2, (y1 - y0) / 2);
    const outline: [number, number][] = [];
    const arc = (cx: number, cy: number, a0: number) => {
      for (let k = 0; k <= SCREEN_CORNER_SEGMENTS; k++) {
        const a = a0 + (k / SCREEN_CORNER_SEGMENTS) * (Math.PI / 2);
        outline.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    };
    arc(x1 - r, y1 - r, 0); // top right
    arc(x0 + r, y1 - r, Math.PI / 2); // top left
    arc(x0 + r, y0 + r, Math.PI); // bottom left
    arc(x1 - r, y0 + r, (3 * Math.PI) / 2); // bottom right
    const pts: [number, number][] = [[(x0 + x1) / 2, (y0 + y1) / 2], ...outline];
    const pos: number[] = [];
    const uv: number[] = [];
    for (const [mx, my] of pts) {
      pos.push(...L(mx, my, z));
      uv.push((mx - x0) / (x1 - x0), (y1 - my) / (y1 - y0));
    }
    const tris: number[] = [];
    for (let k = 1; k <= outline.length; k++) tris.push(0, k, (k % outline.length) + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(tris);
    const rgba = new Uint8Array(ANIM.w * ANIM.h * 4);
    const tex = new THREE.DataTexture(rgba, ANIM.w, ANIM.h, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: accentColor,
      transparent: true,
      opacity: SCREEN_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = "boot-screen";
    // Draw order: backing (writes depth) → ink → all the wireframe lines, so
    // lines in front of the glass blend over the animation, not under it
    mesh.renderOrder = -1;
    // Backing: the same quad a hair lower, in the page background colour
    const backMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const back = new THREE.Mesh(geo, backMat);
    back.name = "boot-screen-backing";
    back.renderOrder = -2;
    back.position.y = -0.15 * s; // just under the glass, so its outline still shows
    host.obj.add(back, mesh);
    screen = { mesh, mat, back, backMat, tex, rgba, frames: null, elapsed: -BOOT_DELAY_MS, shown: -1, done: false };
  }
  // Paint one packed 1-bit frame (row-major, MSB first) into the texture
  function paintFrame(src: Uint8Array, offset: number) {
    if (!screen || !ANIM) return;
    const { rgba } = screen;
    const n = ANIM.w * ANIM.h;
    const ink = ANIM.ink;
    for (let i = 0; i < n; i++) {
      const bit = (src[offset + (i >> 3)] >> (7 - (i & 7))) & 1;
      const v = bit === ink ? 255 : 0;
      const o = i * 4;
      rgba[o] = rgba[o + 1] = rgba[o + 2] = 255;
      rgba[o + 3] = v;
    }
    screen.tex.needsUpdate = true;
  }
  const poster = ANIM ? new Uint8Array(b64ToBuf(ANIM.poster)) : null;
  if (screen && ANIM) {
    if (reduced && poster) {
      // No motion: the screen just shows its end frame
      paintFrame(poster, 0);
      screen.backMat.opacity = SCREEN_BACKING;
      screen.backMat.depthWrite = true;
      screen.done = true;
    } else {
      inflate(ANIM.z)
        .then(f => {
          if (!screen) return;
          if (f && f.length >= ANIM.frames * (ANIM.w * ANIM.h) / 8) screen.frames = f;
          else if (poster) { paintFrame(poster, 0); screen.backMat.opacity = SCREEN_BACKING; screen.backMat.depthWrite = true; screen.done = true; }
          kick();
        })
        .catch(() => {
          if (screen && poster) { paintFrame(poster, 0); screen.backMat.opacity = SCREEN_BACKING; screen.backMat.depthWrite = true; screen.done = true; }
        });
    }
  }

  // Leader lines, one per labelled part
  const svg = overlay?.querySelector("svg") ?? null;
  if (svg) {
    for (const p of parts) {
      if (!p.label) continue;
      // Use a leader already in the markup if there is one
      const existing = svg.querySelector<SVGLineElement>(`[data-leader="${p.g.id}"]`);
      if (existing) {
        p.leader = existing;
        continue;
      }
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(line);
      p.leader = line;
    }
  }

  // ── Line colour follows the site accent token ──────────────────────────
  function applyAccent() {
    const accent = getComputedStyle(accentEl).getPropertyValue("--accent").trim();
    if (accent) accentColor.set(accent);
    for (const p of parts) p.mat.color.copy(accentColor);
    frontMat?.color.copy(accentColor);
    screen?.mat.color.copy(accentColor);
    const bg = getComputedStyle(accentEl).getPropertyValue("--background").trim();
    if (screen && bg) screen.backMat.color.set(bg);
    dirty = true;
    // The loop sleeps once settled, so wake it to repaint in the new colour
    if (started) kick();
  }
  let started = false; // kick() and the loop state are declared further down
  const themeObs = new MutationObserver(applyAccent);
  themeObs.observe(accentEl, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });

  // ── Scroll progress ────────────────────────────────────────────────────
  function targetProgress() {
    const r = track.getBoundingClientRect();
    if (scroller) {
      const sr = scroller.getBoundingClientRect();
      const run = r.height - scroller.clientHeight;
      return run > 0 ? clamp01((sr.top - r.top) / run) : 0;
    }
    const run = r.height - window.innerHeight;
    return run > 0 ? clamp01(-r.top / run) : 0;
  }
  let shown = targetProgress();
  let dirty = true;

  // ── Pose the scene for a given progress ────────────────────────────────
  const curBox = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  const tmpV = new THREE.Vector3();
  const centreV = new THREE.Vector3();
  const dirV = new THREE.Vector3();
  const rightV = new THREE.Vector3();
  const upV = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const basis = new THREE.Matrix4();
  const qFace = new THREE.Quaternion();
  const qFlat = new THREE.Quaternion(); // identity: lying face-up
  function pose(progress: number) {
    const u = clamp01((progress - HOLD_START) / (HOLD_END - HOLD_START));
    // Camera direction for this point in the scroll (from target to camera)
    const yaw = YAW_FROM + (YAW_TO - YAW_FROM) * u + orbitYaw;
    const elev = ELEVATION + orbitPitch;
    dirV.set(
      Math.cos(elev) * Math.sin(yaw),
      Math.sin(elev),
      Math.cos(elev) * Math.cos(yaw)
    );
    rightV.crossVectors(UP, dirV).normalize();
    upV.crossVectors(dirV, rightV);
    // Upright pose: long side (device +X, display end) up the screen, face
    // (+Y) toward the camera, side (+Z) to the right. Slerp to flat.
    basis.makeBasis(upV, dirV, rightV);
    qFace.setFromRotationMatrix(basis);
    const tilt = easeInOut(clamp01((progress - TILT_START) / (TILT_END - TILT_START)));
    root.quaternion.slerpQuaternions(qFace, qFlat, tilt);
    for (const p of parts) {
      p.t = easeInOut(clamp01((u - p.start) / MOVE_SHARE));
      p.obj.position.copy(p.offset).multiplyScalar(p.t * (portrait ? PORTRAIT_SPREAD : 1));
    }
    root.updateMatrixWorld(true);
    curBox.makeEmpty();
    for (const p of parts) curBox.union(tmpBox.copy(p.box).applyMatrix4(p.obj.matrixWorld));
    // Frame the current pose tightly: the camera eases out as the stack
    // grows. Solve for the distance that keeps every sampled vertex in view
    // (box corners overshoot badly once the device is rotated).
    curBox.getCenter(centreV);
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // The model sits centred; on wide stages keep it narrow enough that the
    // callout column fits beside it (about 240px clear on the right)
    const fitW = wide ? Math.min(0.7, Math.max(0.45, (W - 480) / W)) : 1;
    const tanH = tanV * camera.aspect * fitW;
    let dist = 0;
    for (const p of parts) {
      const sm = p.samples;
      const m = p.obj.matrixWorld;
      for (let i = 0; i < sm.length; i += 3) {
        tmpV.set(sm[i], sm[i + 1], sm[i + 2]).applyMatrix4(m).sub(centreV);
        const zc = tmpV.dot(dirV);
        dist = Math.max(dist, Math.abs(tmpV.dot(rightV)) / tanH + zc, Math.abs(tmpV.dot(upV)) / tanV + zc);
      }
    }
    dist *= FIT_MARGIN;
    camera.position.copy(centreV).addScaledVector(dirV, dist);
    camera.lookAt(centreV);
    camera.clearViewOffset();
    camera.updateMatrixWorld();
  }

  // ── Callouts: a right-hand column with leader lines (wide screens), or a
  //    single ticker line under the model (narrow screens) ─────────────────
  let W = 1, H = 1, wide = true, portrait = false;
  const proj = new THREE.Vector3();
  let scr = new Float32Array(0); // scratch screen coords for anchors
  function toScreen(v: THREE.Vector3) {
    proj.copy(v).project(camera);
    return [(proj.x * 0.5 + 0.5) * W, (-proj.y * 0.5 + 0.5) * H];
  }
  function layoutLabels() {
    if (!overlay) return;
    const shownParts = parts.filter(p => p.label);
    if (!wide) {
      let current: Part | null = null;
      for (const p of movers) if (p.label && p.t > 0.6) current = p;
      // Fully apart: let the caption have the last word
      if (movers.every(p => p.t > 0.99)) current = null;
      if (ticker) {
        const text = current?.g.label ?? "";
        if (ticker.textContent !== text) ticker.textContent = text;
      }
      for (const p of shownParts) {
        p.label!.style.opacity = "0";
        p.leader?.setAttribute("opacity", "0");
      }
      return;
    }
    if (ticker && ticker.textContent) ticker.textContent = "";
    // Anchor: a point on the part's right-hand side near its own height, so
    // the leader lands on geometry (not the empty middle of a spread-out
    // group, nor a far corner that sits higher than the part reads)
    let modelRight = 0;
    const items = shownParts.map(p => {
      const sm = p.samples;
      const n = sm.length / 3;
      if (scr.length < n * 2) scr = new Float32Array(n * 2);
      let cy = 0;
      for (let i = 0; i < n; i++) {
        tmpV.set(sm[i * 3], sm[i * 3 + 1], sm[i * 3 + 2]).applyMatrix4(p.obj.matrixWorld);
        const [x, y] = toScreen(tmpV);
        scr[i * 2] = x;
        scr[i * 2 + 1] = y;
        cy += y / n;
        modelRight = Math.max(modelRight, x);
      }
      let ax = 0, ay = 0, best = -Infinity;
      for (let i = 0; i < n; i++) {
        const score = scr[i * 2] - 2 * Math.abs(scr[i * 2 + 1] - cy);
        if (score > best) { best = score; ax = scr[i * 2]; ay = scr[i * 2 + 1]; }
      }
      // A part on the board itself labels once the stack is open
      const vis = p.offset.lengthSq() > 0 ? smooth(0.55, 0.95, p.t) : smooth(0.7, 0.95, maxT());
      return { p, ax, ay, y: ay, vis };
    });
    const colX = Math.min(W - 200, modelRight + 40);
    // De-overlap vertically (top-down then bottom-up), 24px apart
    items.sort((a, b) => a.ay - b.ay);
    const GAP = 24;
    for (let i = 1; i < items.length; i++) items[i].y = Math.max(items[i].y, items[i - 1].y + GAP);
    for (let i = items.length - 1; i >= 0; i--) {
      const lim = i === items.length - 1 ? H - 40 : items[i + 1].y - GAP;
      items[i].y = Math.min(items[i].y, lim);
    }
    for (const it of items) {
      const el = it.p.label!;
      el.style.transform = `translate(${colX.toFixed(1)}px, ${(it.y - 10).toFixed(1)}px)`;
      el.style.opacity = it.vis.toFixed(3);
      const ln = it.p.leader;
      if (ln) {
        ln.setAttribute("x1", (it.ax + 6).toFixed(1));
        ln.setAttribute("y1", it.ay.toFixed(1));
        ln.setAttribute("x2", (colX - 8).toFixed(1));
        ln.setAttribute("y2", it.y.toFixed(1));
        ln.setAttribute("opacity", (it.vis * 0.45).toFixed(3));
      }
    }
  }
  function maxT() {
    let m = 0;
    for (const p of movers) m = Math.max(m, p.t);
    return m;
  }

  // ── Intro playback: reveal edges in growth order over a fixed run ──────
  let introArmed = false;
  let introDone = !introOn;
  let introElapsed = 0;
  let lastFrame = 0;
  function updateIntro(dt: number) {
    if (introDone || !introArmed) return;
    introElapsed += dt;
    const t = Math.min(1, introElapsed / INTRO_MS);
    const e = t * t * (3 - 2 * t);
    for (const p of parts) {
      const edges = p.count / 2;
      const vis = Math.floor(edges * e);
      p.obj.geometry.setDrawRange(0, vis * 2);
      const win = Math.max(16, Math.floor(edges * 0.05));
      const start = Math.max(0, vis - win);
      p.front?.geometry.setDrawRange(start * 2, (vis - start) * 2);
    }
    if (t >= 1) {
      introDone = true;
      for (const p of parts) {
        p.obj.geometry.setDrawRange(0, Infinity);
        if (p.front) {
          p.obj.remove(p.front);
          p.front.geometry.dispose(); // attributes are shared; only frees its own
          p.front = null;
        }
      }
      frontMat?.dispose();
    }
  }

  // ── Boot animation playback: starts once the model has drawn in, plays
  //    once at its own frame rate, then holds its end frame ─────────────────
  function screenPlaying() {
    return !!screen && !screen.done && !!screen.frames && introDone;
  }
  function updateScreen(dt: number) {
    if (!screen || !ANIM || !screenPlaying()) return;
    screen.elapsed += dt;
    // The backing fades in over the pause before the first frame
    screen.backMat.opacity = SCREEN_BACKING * smooth(-BOOT_DELAY_MS, 0, screen.elapsed);
    // Only start hiding what's behind once the backing is mostly in
    screen.backMat.depthWrite = screen.backMat.opacity > SCREEN_BACKING * 0.5;
    if (screen.elapsed < 0) return;
    const f = Math.min(ANIM.hold, Math.floor((screen.elapsed / 1000) * ANIM.fps));
    if (f !== screen.shown) {
      paintFrame(screen.frames!, f * ((ANIM.w * ANIM.h) / 8));
      screen.shown = f;
    }
    if (f >= ANIM.hold) {
      screen.done = true;
      screen.frames = null; // the held frame stays on the texture
    }
  }

  function render() {
    const now = performance.now();
    const raw = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    updateIntro(Math.min(50, raw));
    // The boot animation keeps real time on slow devices (but doesn't leap
    // ahead after the tab was hidden)
    updateScreen(Math.min(250, raw));
    pose(shown);
    renderer.render(scene, camera);
    layoutLabels();
  }

  // ── Orbit: drag to turn once fully exploded ────────────────────────────
  const orbitOn = opts.orbit ?? true;
  let orbitYaw = 0, orbitPitch = 0;
  let yawVel = 0;
  let dragging = false;
  let canOrbit = false;
  let lastSnap = 0;
  const orbitMag = () => Math.abs(orbitYaw) + Math.abs(orbitPitch);
  function setCanOrbit(on: boolean) {
    if (on === canOrbit) return;
    canOrbit = on;
    track.classList.toggle("cx-can-orbit", on);
    renderer.domElement.style.cursor = on ? "grab" : "";
  }
  // Vertical swipes keep scrolling the page on touch; sideways ones turn it
  renderer.domElement.style.touchAction = "pan-y";
  let lastX = 0, lastY = 0;
  const onDown = (e: PointerEvent) => {
    if (!orbitOn || !canOrbit) return;
    dragging = true;
    yawVel = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.domElement.setPointerCapture?.(e.pointerId);
    renderer.domElement.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Grab convention: the near face follows the pointer
    yawVel = -dx * ORBIT_SPEED;
    orbitYaw += yawVel;
    if (e.pointerType === "mouse") {
      orbitPitch = Math.max(ORBIT_PITCH_MIN, Math.min(ORBIT_PITCH_MAX, orbitPitch + dy * ORBIT_SPEED));
    }
    dirty = true;
    kick();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    if (reduced) yawVel = 0;
    renderer.domElement.style.cursor = canOrbit ? "grab" : "";
    kick();
  };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointercancel", onUp);

  // ── Loop: only runs while the stage is on screen and something changed ──
  let raf = 0;
  let visible = false;
  function loop() {
    raf = 0;
    if (!visible) return;
    const target = targetProgress();
    const k = reduced ? 1 : DAMPING;
    let next = shown + (target - shown) * k;
    // Scrolled back up while turned: swing home first (shortest way round),
    // holding the explode open until it gets there, then close up
    const now = performance.now();
    const sdt = lastSnap ? Math.min(50, now - lastSnap) : 16;
    lastSnap = now;
    const snapping = !dragging && orbitMag() > 0.002 && target < HOLD_END - 0.001;
    if (snapping) {
      dragging = false;
      yawVel = 0;
      orbitYaw = Math.atan2(Math.sin(orbitYaw), Math.cos(orbitYaw));
      const f = reduced ? 0 : Math.exp(-sdt / ORBIT_RETURN_MS);
      orbitYaw *= f;
      orbitPitch *= f;
      if (orbitMag() <= 0.002) orbitYaw = orbitPitch = 0;
      next = Math.max(next, HOLD_END);
    } else if (!dragging && Math.abs(yawVel) > 0.0005) {
      // A flick keeps turning and spins down
      orbitYaw += yawVel;
      yawVel *= ORBIT_FRICTION;
    } else if (!dragging) yawVel = 0;
    setCanOrbit(orbitOn && !snapping && next >= HOLD_END - 0.002);
    const spinning = !dragging && Math.abs(yawVel) > 0.0005;
    const animating = (introArmed && !introDone) || screenPlaying() || snapping || spinning;
    if (Math.abs(target - next) < 0.0004 && !animating) {
      if (shown !== target || dirty) {
        shown = target;
        render();
      }
      dirty = false;
      lastFrame = 0;
      lastSnap = 0;
      return; // settled: wait for the next scroll
    }
    shown = next;
    render();
    raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!raf && visible) raf = requestAnimationFrame(loop);
  };
  const scrollSrc: HTMLElement | Window = scroller ?? window;
  scrollSrc.addEventListener("scroll", kick, { passive: true });

  const io = new IntersectionObserver(
    entries => {
      const e = entries[0];
      visible = e?.isIntersecting ?? false;
      // Hold the intro until the stage is properly on screen
      if ((e?.intersectionRatio ?? 0) >= INTRO_ARM_RATIO) introArmed = true;
      lastFrame = 0;
      if (visible) {
        dirty = true;
        kick();
      }
    },
    { threshold: [0, INTRO_ARM_RATIO] }
  );
  io.observe(container);

  // ── Resize with the stage ──────────────────────────────────────────────
  function resize() {
    W = container.clientWidth;
    H = container.clientHeight;
    if (!W || !H) return;
    wide = W >= 640;
    portrait = H > W * 1.15;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    overlay?.classList.toggle("is-wide", wide);
    if (svg) svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    dirty = true;
    render();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  applyAccent();
  started = true;
  resize();

  // ── Cleanup (called before re-mounting after view transitions) ─────────
  return () => {
    cancelAnimationFrame(raf);
    scrollSrc.removeEventListener("scroll", kick);
    renderer.domElement.removeEventListener("pointerdown", onDown);
    renderer.domElement.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("pointerup", onUp);
    renderer.domElement.removeEventListener("pointercancel", onUp);
    track.classList.remove("cx-can-orbit");
    io.disconnect();
    ro.disconnect();
    themeObs.disconnect();
    for (const p of parts) {
      p.front?.geometry.dispose();
      p.obj.geometry.dispose();
      p.mat.dispose();
      if (!p.leader?.dataset.leader) p.leader?.remove();
    }
    if (!introDone) frontMat?.dispose();
    if (screen) {
      screen.mesh.geometry.dispose();
      screen.mat.dispose();
      screen.backMat.dispose();
      screen.tex.dispose();
      screen = null;
    }
    renderer.dispose();
    renderer.domElement.remove();
  };
}
