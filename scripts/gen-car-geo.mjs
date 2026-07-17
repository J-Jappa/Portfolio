/**
 * gen-car-geo.mjs
 * Bakes src/assets/models/solar-car.obj into src/assets/models/solar-car-geo.js:
 * base64 typed arrays grouped for the hero's three.js x-ray wireframe.
 * Run with: node scripts/gen-car-geo.mjs
 *
 * Groups (all share world space; the runtime normalises them together):
 *   top        body shell faces whose normal points up
 *   bottom     body shell faces whose normal points down
 *   wheelFull  the complete wheels (kept for occluder experiments)
 *   wheelTread wheels without their end-cap discs (used by the x-ray view)
 */

import fs from "node:fs";

const SRC = "src/assets/models/solar-car.obj";
const OUT = "src/assets/models/solar-car-geo.js";

// ── Parse the OBJ ────────────────────────────────────────────────────
const text = fs.readFileSync(SRC, "utf8");
const verts = [];
const faces = [];
for (const line of text.split(/\r?\n/)) {
  if (line.startsWith("v ")) {
    const p = line.slice(2).trim().split(/\s+/).map(Number);
    verts.push([p[0], p[1], p[2]]);
  } else if (line.startsWith("f ")) {
    const idx = line
      .slice(2)
      .trim()
      .split(/\s+/)
      .map(t => {
        const i = parseInt(t.split("/")[0], 10);
        return i > 0 ? i - 1 : verts.length + i;
      });
    // Triangulate as a fan (the export is already triangles, but be safe)
    for (let i = 1; i < idx.length - 1; i++) {
      faces.push([idx[0], idx[i], idx[i + 1]]);
    }
  }
}
console.log(`parsed ${verts.length} verts, ${faces.length} tris`);

// ── Connected components (body vs the three wheels) ─────────────────
// Weld with a fine tolerance purely for connectivity so parts that touch
// (wheel in its well) stay separate.
const weld = new Map();
const remap = verts.map(v => {
  const k = `${Math.round(v[0] * 50)}:${Math.round(v[1] * 50)}:${Math.round(v[2] * 50)}`;
  if (!weld.has(k)) weld.set(k, weld.size);
  return weld.get(k);
});
const parent = [...Array(weld.size).keys()];
const find = x => {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
};
for (const f of faces) {
  const a = find(remap[f[0]]);
  const b = find(remap[f[1]]);
  const c = find(remap[f[2]]);
  if (a !== b) parent[a] = b;
  if (find(a) !== c) parent[find(a)] = c;
}
const compFaces = new Map();
for (const f of faces) {
  const c = find(remap[f[0]]);
  if (!compFaces.has(c)) compFaces.set(c, []);
  compFaces.get(c).push(f);
}
const comps = [...compFaces.values()].sort((a, b) => b.length - a.length);
const bodyFaces = comps[0];
const wheelComps = comps.slice(1).filter(c => c.length >= 20);
console.log(
  `components: body ${bodyFaces.length} tris, wheels ${wheelComps.map(c => c.length).join(", ")}`
);

// ── Face normal helper ───────────────────────────────────────────────
function normal(f) {
  const [a, b, c] = [verts[f[0]], verts[f[1]], verts[f[2]]];
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}

// Body split: faces above a horizontal plane just over mid-pod height
// (deck, canopy, upper sides) keep detail; everything below it is the
// underside region, which the runtime decimates much harder.
let bodyMinY = Infinity;
let bodyMaxY = -Infinity;
for (const f of bodyFaces) {
  for (const i of f) {
    if (verts[i][1] < bodyMinY) bodyMinY = verts[i][1];
    if (verts[i][1] > bodyMaxY) bodyMaxY = verts[i][1];
  }
}
const splitY = bodyMinY + (bodyMaxY - bodyMinY) * 0.38;
const topFaces = [];
const bottomFaces = [];
for (const f of bodyFaces) {
  const cy = (verts[f[0]][1] + verts[f[1]][1] + verts[f[2]][1]) / 3;
  (cy >= splitY ? topFaces : bottomFaces).push(f);
}

// Wheels: full copies, plus a "tread" variant without the end-cap discs
// (faces whose normal is aligned with the wheel's own thin axis).
const wheelFullFaces = [];
const wheelTreadFaces = [];
for (const comp of wheelComps) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const seen = new Set();
  for (const f of comp) for (const i of f) seen.add(i);
  for (const i of seen) {
    for (let a = 0; a < 3; a++) {
      if (verts[i][a] < min[a]) min[a] = verts[i][a];
      if (verts[i][a] > max[a]) max[a] = verts[i][a];
    }
  }
  const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const axis = ext.indexOf(Math.min(...ext));
  for (const f of comp) {
    wheelFullFaces.push(f);
    if (Math.abs(normal(f)[axis]) < 0.5) wheelTreadFaces.push(f);
  }
}

// ── Build indexed geometry per group and encode ──────────────────────
function bake(groupFaces) {
  const map = new Map(); // original vert index -> local index
  const pos = [];
  const idx = [];
  for (const f of groupFaces) {
    for (const i of f) {
      let m = map.get(i);
      if (m === undefined) {
        m = map.size;
        map.set(i, m);
        pos.push(verts[i][0], verts[i][1], verts[i][2]);
      }
      idx.push(m);
    }
  }
  const nv = map.size;
  const u32 = nv > 65535;
  const posBuf = Buffer.from(new Float32Array(pos).buffer).toString("base64");
  const idxArr = u32 ? new Uint32Array(idx) : new Uint16Array(idx);
  const idxBuf = Buffer.from(idxArr.buffer).toString("base64");
  return { nv, tris: groupFaces.length, u32, pos: posBuf, idx: idxBuf };
}

const groups = {
  top: bake(topFaces),
  bottom: bake(bottomFaces),
  wheelFull: bake(wheelFullFaces),
  wheelTread: bake(wheelTreadFaces),
};

let out =
  "// Auto-generated by scripts/gen-car-geo.mjs from solar-car.obj. Do not edit.\n" +
  "// Groups share world space. top/bottom = body shell; wheelFull = occluder wheels;\n" +
  "// wheelTread = wheels without end-cap discs (used by the hero x-ray wireframe).\n" +
  "export const GROUPS = {\n";
for (const [name, g] of Object.entries(groups)) {
  out += `  ${name}: { nv:${g.nv}, tris:${g.tris}, u32:${g.u32}, pos:"${g.pos}", idx:"${g.idx}" },\n`;
  console.log(`${name}: ${g.nv} verts, ${g.tris} tris`);
}
out += "};\n";
fs.writeFileSync(OUT, out);
console.log(`OK  ${OUT} (${Math.round(out.length / 1024)} KB)`);
