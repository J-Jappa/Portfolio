// Placeholder low-poly wireframe models for the cameras used in the project.
//
// Each model is a plain list of 3D vertices + edges (index pairs), centred
// roughly on the origin with the lens facing +Z. They're deliberately chunky
// and schematic — stand-ins until real CAD wireframes are dropped in. The
// photo lightboxes render whichever model matches the camera named at the end
// of a roll folder ("<location> · <film> · <camera>").
//
// To swap in a real model, replace the relevant builder with `{ name, verts,
// edges }` parsed from your export (see the OBJ note in the photography README).

export type Wireframe = {
  name: string;
  spec: string; // short one-liner: format / type / era
  desc: string; // a sentence or two — edit these freely
  verts: number[][];
  edges: number[][];
};

type B = { V: number[][]; E: number[][] };
const mk = (): B => ({ V: [], E: [] });

function add(b: B, verts: number[][], edges: number[][]) {
  const o = b.V.length;
  for (const v of verts) b.V.push(v);
  for (const [a, c] of edges) b.E.push([a + o, c + o]);
}

// Axis-aligned box (wireframe cuboid).
function box(b: B, w: number, h: number, d: number, c: number[] = [0, 0, 0]) {
  const [cx, cy, cz] = c;
  const x = w / 2, y = h / 2, z = d / 2;
  add(
    b,
    [
      [cx - x, cy - y, cz - z], [cx + x, cy - y, cz - z], [cx + x, cy + y, cz - z], [cx - x, cy + y, cz - z],
      [cx - x, cy - y, cz + z], [cx + x, cy - y, cz + z], [cx + x, cy + y, cz + z], [cx - x, cy + y, cz + z],
    ],
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
  );
}

// Cylinder / truncated cone: two rings (radius r → r2) joined by struts.
function cyl(
  b: B, r: number, len: number, seg: number, c: number[], axis: "x" | "y" | "z" = "z", r2?: number
) {
  const [cx, cy, cz] = c;
  const h = len / 2;
  const rf = r2 ?? r;
  const verts: number[][] = [];
  const edges: number[][] = [];
  for (let s = 0; s < seg; s++) {
    const a = (s / seg) * Math.PI * 2;
    const co = Math.cos(a), si = Math.sin(a);
    if (axis === "z") { verts.push([cx + co * r, cy + si * r, cz - h], [cx + co * rf, cy + si * rf, cz + h]); }
    else if (axis === "y") { verts.push([cx + co * r, cy - h, cz + si * r], [cx + co * rf, cy + h, cz + si * rf]); }
    else { verts.push([cx - h, cy + co * r, cz + si * r], [cx + h, cy + co * rf, cz + si * rf]); }
  }
  for (let s = 0; s < seg; s++) {
    const i0 = s * 2, i1 = i0 + 1, j0 = ((s + 1) % seg) * 2, j1 = j0 + 1;
    edges.push([i0, j0], [i1, j1], [i0, i1]);
  }
  add(b, verts, edges);
}

// ── the four cameras ────────────────────────────────────────────────────────

function nikonFM(): Wireframe {
  const b = mk();
  box(b, 1.5, 0.95, 0.56);                     // body
  box(b, 0.56, 0.34, 0.5, [0, 0.62, -0.02]);   // pentaprism hump
  cyl(b, 0.34, 0.6, 14, [0, -0.06, 0.5], "z", 0.3); // lens barrel
  cyl(b, 0.28, 0.08, 14, [0, -0.06, 0.82]);    // front lens ring
  cyl(b, 0.12, 0.2, 10, [-0.6, 0.6, -0.02], "y");  // rewind knob
  cyl(b, 0.15, 0.13, 10, [0.58, 0.6, -0.02], "y"); // shutter dial
  box(b, 0.3, 0.05, 0.14, [0.82, 0.52, 0]);    // wind lever
  return {
    name: "Nikon FM",
    spec: "35mm SLR · 1977",
    desc: "Nikon's all-mechanical workhorse. Shoots without batteries, match-needle metering, bulletproof brass build — the classic student and travel SLR on the Nikon F mount.",
    verts: b.V,
    edges: b.E,
  };
}

function panomicronOxygen(): Wireframe {
  const b = mk();
  box(b, 2.4, 0.72, 0.42);                     // wide panoramic body
  box(b, 0.5, 0.2, 0.4, [0, 0.46, 0]);         // viewfinder bump
  cyl(b, 0.26, 0.42, 14, [0, -0.02, 0.4], "z", 0.22); // lens
  cyl(b, 0.2, 0.06, 14, [0, -0.02, 0.63]);     // lens ring
  cyl(b, 0.1, 0.16, 10, [-1.08, 0.44, 0], "y");// left wind knob
  cyl(b, 0.1, 0.16, 10, [1.08, 0.44, 0], "y"); // right knob
  return {
    name: "Panomicron Oxygen",
    spec: "Panoramic · placeholder",
    desc: "Wide-format panoramic body. Placeholder entry — replace the spec, description and wireframe for this one in src/data/cameras.ts with the real camera details.",
    verts: b.V,
    edges: b.E,
  };
}

function yashicaA(): Wireframe {
  const b = mk();
  box(b, 0.95, 1.5, 0.82, [0, -0.1, 0]);       // tall TLR body
  box(b, 0.9, 0.42, 0.8, [0, 0.86, 0]);        // waist-level finder hood
  cyl(b, 0.3, 0.34, 14, [0, -0.34, 0.42]);     // taking lens (lower)
  cyl(b, 0.27, 0.3, 14, [0, 0.36, 0.42]);      // viewing lens (upper)
  cyl(b, 0.14, 0.16, 10, [0.6, -0.1, 0], "x"); // focus knob
  return {
    name: "Yashica-A",
    spec: "6×6 TLR · 120 film",
    desc: "Twin-lens reflex making square 6×6 negatives on 120 roll film. Waist-level finder, knob wind and a simple geared front standard — fully mechanical medium format from the late 1950s.",
    verts: b.V,
    edges: b.E,
  };
}

function pentaxEspio(): Wireframe {
  const b = mk();
  box(b, 1.5, 0.86, 0.4);                      // compact body
  cyl(b, 0.2, 0.26, 12, [0.34, -0.04, 0.34], "z", 0.16); // zoom lens (off-centre)
  cyl(b, 0.15, 0.05, 12, [0.34, -0.04, 0.5]);  // lens ring
  box(b, 0.34, 0.18, 0.06, [-0.5, 0.28, 0.18]);// flash
  box(b, 0.26, 0.14, 0.05, [-0.05, 0.3, 0.18]);// viewfinder window
  box(b, 0.14, 0.08, 0.1, [0.5, 0.5, 0]);      // shutter button
  return {
    name: "Pentax Espio 95s",
    spec: "35mm compact · zoom",
    desc: "Autofocus 35mm point-and-shoot with a 38–95mm zoom. Pocket-sized, program-auto everything — the jacket-pocket camera for grab shots.",
    verts: b.V,
    edges: b.E,
  };
}

export const CAMERA_MODELS: Record<string, Wireframe> = {
  "Nikon FM": nikonFM(),
  "Panomicron Oxygen": panomicronOxygen(),
  "Yashica-A": yashicaA(),
  "Pentax Espio 95s": pentaxEspio(),
};

const ALIASES: Record<string, string> = {
  nikonfm: "Nikon FM",
  panomicronoxygen: "Panomicron Oxygen",
  panomicron: "Panomicron Oxygen",
  oxygen: "Panomicron Oxygen",
  yashicaa: "Yashica-A",
  yashica: "Yashica-A",
  pentaxespio95s: "Pentax Espio 95s",
  pentaxespio: "Pentax Espio 95s",
  espio95s: "Pentax Espio 95s",
  espio: "Pentax Espio 95s",
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Resolve a free-text camera name (from a folder) to a known model. Forgiving
// about spacing, case and punctuation. Returns null when nothing matches.
export function matchCamera(raw?: string | null): { key: string; name: string } | null {
  if (!raw) return null;
  const n = slug(raw);
  if (!n) return null;
  for (const key of Object.keys(CAMERA_MODELS)) {
    if (slug(key) === n) return { key, name: key };
  }
  if (ALIASES[n]) return { key: ALIASES[n], name: ALIASES[n] };
  for (const key of Object.keys(CAMERA_MODELS)) {
    const k = slug(key);
    if (n.includes(k) || k.includes(n)) return { key, name: key };
  }
  return null;
}
