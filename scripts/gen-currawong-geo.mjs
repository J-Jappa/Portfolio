/**
 * gen-currawong-geo.mjs
 * Bakes the per-part SolidWorks STL export in src/assets/models/currawong/
 * into src/assets/models/currawong-geo.js: one edge set per explode group,
 * quantised to Uint16 and base64'd, for the scroll-driven exploded view.
 * Run with: node scripts/gen-currawong-geo.mjs   (add --xray for the all-triangle look)
 *
 * Export settings that keep the parts aligned (SolidWorks > Save As > STL >
 * Options): Binary, Coarse, untick "Save all components of an assembly in a
 * single file", tick "Do not translate STL output data to positive space".
 *
 * Every part is matched to a group by filename (first rule wins). Each group
 * has an explode offset in model mm along the stack axis (+Z is the front
 * face) and a line style:
 *   wire   every triangle edge (the Monty x-ray look)
 *   edges  only creases sharper than `crease` degrees, plus open boundaries
 *          (keeps dense electronics parts from turning into solid blobs)
 *   turned each part redrawn as its lathe profile: rings where the radius
 *          steps, joined by four lines (screws, without a thread's worth
 *          of triangles)
 * `weld` (mm) snaps vertices to a grid first, a cheap simplification that
 * collapses fine detail on finely exported parts.
 *
 * If a .anim file (the device's 1-bit boot animation, CRWANIM1) sits in the
 * same folder it is embedded too, and plays on the display's glass.
 */

import fs from "node:fs";
import path from "node:path";

const SRC_DIR = "src/assets/models/currawong";
// --xray: every part as full triangle wireframe (the Monty look), written
// to a separate file so the two styles can be compared
const XRAY = process.argv.includes("--xray");
const OUT = XRAY ? "src/assets/models/currawong-geo-xray.js" : "src/assets/models/currawong-geo.js";

// Order here is only for matching (first match wins), so specific parts sit
// above the catch-all PCB rule. `label: null` = moves but is not labelled.
// `dz: "auto"` = lifts off the front of the board if the part sits above it,
// drops away behind it otherwise (handy while new parts are going in).
const RULES = [
  { id: "frontCase", label: null, match: /Front Case/i, dz: 92, style: "edges", crease: 20 },
  { id: "dial", label: "Dial", match: /\bDial\b/i, dz: 70, style: "edges", crease: 20 },
  { id: "buttons", label: null, match: /Button (Back|Center|Next|Play|Previous)/i, dz: 52, style: "edges", crease: 20 },
  // screen: its top glass face becomes the boot-animation surface
  { id: "display", label: "Display", match: /Display/i, dz: 32, style: "edges", crease: 20, screen: true },
  { id: "motor", label: "2804 brushless motor", match: /HTY2804/i, dz: 15, style: "edges", crease: 30 },
  { id: "slide", label: null, match: /Slide-\d/i, dz: 0, dx: -16, style: "wire" },
  { id: "dac", label: "DAC", match: /Dac/i, dz: -16, style: "wire" },
  { id: "usb", label: "USB breakout", match: /USB Breakout/i, dz: -16, style: "edges", crease: 40, weld: 0.3 },
  { id: "encoder", label: "AS5600 magnetic encoder", match: /AS5600/i, dz: -30, style: "edges", crease: 40 },
  { id: "standoffs", label: null, match: /M2\.5x7/i, dz: -30, style: "edges", crease: 30 },
  { id: "battery", label: "Battery", match: /Battery/i, dz: -48, style: "wire" },
  { id: "backCase", label: null, match: /Back Case/i, dz: -86, style: "edges", crease: 20 },
  // Modules from the BOM. Front of the board: the Pi sits under the display,
  // the fuel gauge at the bottom, the motor driver beside the dial.
  { id: "pi", label: "Raspberry Pi Zero", match: /Ra?s?pberry ?Pi|Pi ?Zero|RPi/i, dz: 18, style: "edges", crease: 40, weld: 0.3 },
  { id: "gauge", label: "MAX17048 fuel gauge", match: /MAX17048|Fuel Gauge/i, dz: 14, style: "edges", crease: 35, weld: 0.25 },
  { id: "driver", label: "TMC6300 motor driver", match: /TMC6300/i, dz: 10, style: "edges", crease: 30 },
  // Behind the board. (The CAD model is a XIAO ESP32-C3 standing in for the
  // S3, same footprint.)
  { id: "xiao", label: "XIAO ESP32-S3", match: /XIAO|ESP32/i, dz: -12, style: "edges", crease: 35, weld: 0.25 },
  { id: "boost", label: "PowerBoost 1000C", match: /PowerBoost|Power Boost/i, dz: -22, style: "edges", crease: 35, weld: 0.25 },
  { id: "encoderEc11", label: null, match: /EC11/i, dz: "auto", style: "edges", crease: 30 },
  // Fasteners back out the way they went in: each screw moves towards its
  // head. Front-headed screws clear the front case, unless the head sits
  // under it (a board screw), in which case it just lifts off the board.
  // Drawn as lathe profiles so threads don't turn solid.
  { id: "screws", label: null, match: /Screw/i, split: { front: 108, board: 26, back: -102 }, style: "turned" },
  // Everything on the main board (caps, diode, JSTs, tact switches, slide switch)
  { id: "pcb", label: "Main PCB", match: /PCB v1|Slide Switch/i, dz: 0, style: "edges", crease: 30 },
];

// ── STL reader (binary, with an ASCII fallback) ─────────────────────────
function readStl(file) {
  const buf = fs.readFileSync(file);
  const n = buf.readUInt32LE(80);
  if (84 + n * 50 === buf.length) {
    const tris = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50 + 12;
      for (let k = 0; k < 9; k++) tris[i * 9 + k] = buf.readFloatLE(o + k * 4);
    }
    return tris;
  }
  const out = [];
  for (const m of buf.toString("utf8").matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)) {
    out.push(+m[1], +m[2], +m[3]);
  }
  return new Float32Array(out);
}

// ── Load and group parts ────────────────────────────────────────────────
const files = fs
  .readdirSync(SRC_DIR)
  .filter(f => /\.stl$/i.test(f))
  .sort();
if (!files.length) throw new Error(`no STL files in ${SRC_DIR}`);

// Which way a screw comes out: towards whichever end of its (Z) axis is
// widest, i.e. its head. "board" = head to the front but below the front case.
const FRONT_CASE_UNDERSIDE = 6.8; // model mm
function screwSide(t) {
  let lo = Infinity, hi = -Infinity, cx = 0, cy = 0;
  const n = t.length / 3;
  for (let i = 0; i < t.length; i += 3) {
    lo = Math.min(lo, t[i + 2]); hi = Math.max(hi, t[i + 2]);
    cx += t[i] / n; cy += t[i + 1] / n;
  }
  const band = Math.max(0.6, (hi - lo) * 0.12);
  let rLo = 0, rHi = 0;
  for (let i = 0; i < t.length; i += 3) {
    const r = Math.hypot(t[i] - cx, t[i + 1] - cy);
    if (t[i + 2] < lo + band) rLo = Math.max(rLo, r);
    if (t[i + 2] > hi - band) rHi = Math.max(rHi, r);
  }
  if (rLo >= rHi) return "back";
  return hi < FRONT_CASE_UNDERSIDE ? "board" : "front";
}

const groups = new Map(RULES.map(r => [r.id, { rule: r, tris: [], parts: 0 }]));
const BOARD_TOP = 1.5; // model mm, top of the PCB
for (const f of files) {
  const rule = RULES.find(r => r.match.test(f)) ?? RULES.find(r => r.id === "pcb");
  if (!RULES.some(r => r.match.test(f))) console.warn(`unmatched, put on PCB: ${f}`);
  const tris = readStl(path.join(SRC_DIR, f));
  let g = groups.get(rule.id);
  if (rule.split) {
    const side = screwSide(tris);
    const id = rule.id + side[0].toUpperCase() + side.slice(1);
    if (!groups.has(id)) groups.set(id, { rule: { ...rule, id, dz: rule.split[side] }, tris: [], parts: 0 });
    g = groups.get(id);
  }
  g.tris.push(tris);
  g.parts++;
}
for (const r of RULES) if (r.split) groups.delete(r.id); // the unsplit placeholder

// Resolve dz: "auto" from where the part sits against the board's top face
for (const g of groups.values()) {
  if (g.rule.dz !== "auto" || !g.parts) continue;
  let sum = 0, n = 0;
  for (const t of g.tris) for (let i = 2; i < t.length; i += 3) { sum += t[i]; n++; }
  g.dz = sum / n > BOARD_TOP ? 12 : -16;
  console.log(`${g.rule.id}: auto dz ${g.dz} (sits ${g.dz > 0 ? "in front of" : "behind"} the board)`);
}

// Shared bounds so every group quantises into the same frame
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const g of groups.values()) {
  for (const t of g.tris) {
    for (let i = 0; i < t.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        if (t[i + a] < min[a]) min[a] = t[i + a];
        if (t[i + a] > max[a]) max[a] = t[i + a];
      }
    }
  }
}

// ── Edge extraction per group ───────────────────────────────────────────
// Lathe-profile outline of one roughly axisymmetric part (a screw): picks
// the axis whose cross-section is roundest, samples the max radius along it,
// keeps the steps, and emits rings at each step joined by four lines.
function turnedEdges(t, pos, idx) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < t.length; i += 3) for (let a = 0; a < 3; a++) {
    lo[a] = Math.min(lo[a], t[i + a]); hi[a] = Math.max(hi[a], t[i + a]);
  }
  const ext = [0, 1, 2].map(a => hi[a] - lo[a]);
  const axis = [0, 1, 2].sort((a, b) => {
    const round = ax => { const o = [0, 1, 2].filter(k => k !== ax); return Math.abs(ext[o[0]] - ext[o[1]]); };
    return round(a) - round(b);
  })[0];
  const [u, v] = [0, 1, 2].filter(k => k !== axis);
  const cu = (lo[u] + hi[u]) / 2, cv = (lo[v] + hi[v]) / 2;
  const STEP = 0.25, len = ext[axis];
  const bins = Math.max(1, Math.ceil(len / STEP));
  const r = new Float64Array(bins + 1);
  for (let i = 0; i < t.length; i += 3) {
    const b = Math.round(((t[i + axis] - lo[axis]) / (len || 1)) * bins);
    r[b] = Math.max(r[b], Math.hypot(t[i + u] - cu, t[i + v] - cv));
  }
  for (let b = 1; b <= bins; b++) if (r[b] === 0) r[b] = r[b - 1]; // empty bins
  // Keep a ring wherever the radius has drifted from the last ring, and on
  // both sides of any sudden step (a head meeting the shank)
  const keep = [0];
  const add = b => { if (keep[keep.length - 1] !== b) keep.push(b); };
  for (let b = 1; b <= bins; b++) {
    if (Math.abs(r[b] - r[b - 1]) > 0.3) { add(b - 1); add(b); }
    else if (Math.abs(r[b] - r[keep[keep.length - 1]]) > 0.3) add(b);
  }
  add(bins);
  const SEG = 12;
  const ringStart = [];
  for (const b of keep) {
    ringStart.push(pos.length / 3);
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * Math.PI * 2;
      const p = [0, 0, 0];
      p[axis] = lo[axis] + (b / bins) * len;
      p[u] = cu + r[b] * Math.cos(a);
      p[v] = cv + r[b] * Math.sin(a);
      pos.push(...p);
    }
  }
  for (let j = 0; j < ringStart.length; j++) {
    const s0 = ringStart[j];
    for (let k = 0; k < SEG; k++) idx.push(s0 + k, s0 + ((k + 1) % SEG));
    if (j > 0) for (let k = 0; k < SEG; k += SEG / 4) idx.push(ringStart[j - 1] + k, s0 + k);
  }
  return t.length / 9;
}

function bakeGroup(g) {
  const { crease = 30, weld: grid = 0 } = g.rule;
  const style = XRAY ? "wire" : g.rule.style;
  const cosCrease = Math.cos((crease * Math.PI) / 180);
  const weld = new Map();
  const pos = [];
  const snap = grid > 0 ? 1 / grid : 500;
  const vid = (x, y, z) => {
    const k = `${Math.round(x * snap)}:${Math.round(y * snap)}:${Math.round(z * snap)}`;
    let i = weld.get(k);
    if (i === undefined) {
      i = pos.length / 3;
      weld.set(k, i);
      if (grid > 0) pos.push(Math.round(x * snap) / snap, Math.round(y * snap) / snap, Math.round(z * snap) / snap);
      else pos.push(x, y, z);
    }
    return i;
  };
  if (style === "turned" && !XRAY) {
    const idx = [];
    let triCount = 0;
    for (const t of g.tris) triCount += turnedEdges(t, pos, idx);
    return encode(pos, idx, triCount);
  }
  // edge key -> [a, b, first face normal, matched]
  const edges = new Map();
  let triCount = 0;
  for (const t of g.tris) {
    for (let i = 0; i < t.length; i += 9) {
      const v = [vid(t[i], t[i + 1], t[i + 2]), vid(t[i + 3], t[i + 4], t[i + 5]), vid(t[i + 6], t[i + 7], t[i + 8])];
      if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) continue; // degenerate after weld
      triCount++;
      // Normal from the welded positions, so collapsed detail reads as flat
      const P = (k, a) => pos[v[k] * 3 + a];
      const ux = P(1, 0) - P(0, 0), uy = P(1, 1) - P(0, 1), uz = P(1, 2) - P(0, 2);
      const wx = P(2, 0) - P(0, 0), wy = P(2, 1) - P(0, 1), wz = P(2, 2) - P(0, 2);
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const l = Math.hypot(nx, ny, nz);
      if (!l) { triCount--; continue; } // flattened by the weld
      nx /= l; ny /= l; nz /= l;
      for (let e = 0; e < 3; e++) {
        const a = v[e], b = v[(e + 1) % 3];
        const k = a < b ? `${a}_${b}` : `${b}_${a}`;
        const hit = edges.get(k);
        if (!hit) edges.set(k, { a, b, n: [nx, ny, nz], keep: false, faces: 1 });
        else {
          hit.faces++;
          const d = hit.n[0] * nx + hit.n[1] * ny + hit.n[2] * nz;
          if (d < cosCrease) hit.keep = true;
        }
      }
    }
  }
  const idx = [];
  for (const e of edges.values()) {
    if (style === "wire" || e.keep || e.faces === 1) idx.push(e.a, e.b);
  }
  return encode(pos, idx, triCount);
}

function encode(pos, idx, triCount) {
  // Compact to the vertices actually used, then quantise to Uint16
  const used = new Map();
  const q = [];
  const outIdx = idx.map(i => {
    let m = used.get(i);
    if (m === undefined) {
      m = used.size;
      used.set(i, m);
      for (let a = 0; a < 3; a++) {
        const s = (pos[i * 3 + a] - min[a]) / (max[a] - min[a] || 1);
        q.push(Math.round(s * 65535));
      }
    }
    return m;
  });
  const nv = used.size;
  const u32 = nv > 65535;
  const posB64 = Buffer.from(new Uint16Array(q).buffer).toString("base64");
  const idxB64 = Buffer.from((u32 ? new Uint32Array(outIdx) : new Uint16Array(outIdx)).buffer).toString("base64");
  return { nv, ne: outIdx.length / 2, tris: triCount, u32, pos: posB64, idx: idxB64 };
}

let out =
  "// Auto-generated by scripts/gen-currawong-geo.mjs from src/assets/models/currawong/*.STL. Do not edit.\n" +
  "// Positions are Uint16, quantised into BOUNDS (model mm). idx = line-segment pairs.\n" +
  "// dz / dx = explode offset in model mm (+Z is the front face).\n" +
  `export const BOUNDS = { min: [${min.map(v => +v.toFixed(3))}], max: [${max.map(v => +v.toFixed(3))}] };\n` +
  "export const GROUPS = [\n";
let total = 0;
for (const g of groups.values()) {
  if (!g.parts) continue;
  const b = bakeGroup(g);
  total += b.ne;
  const r = g.rule;
  out += `  { id:${JSON.stringify(r.id)}, label:${JSON.stringify(r.label)}, dz:${g.dz ?? r.dz}, dx:${r.dx ?? 0}, nv:${b.nv}, ne:${b.ne}, u32:${b.u32}, pos:"${b.pos}", idx:"${b.idx}" },\n`;
  console.log(`${r.id.padEnd(10)} ${String(g.parts).padStart(2)} parts  ${String(b.tris).padStart(6)} tris -> ${String(b.ne).padStart(6)} edges (${r.style})`);
}
out += "];\n";

// ── Screen rectangle: the display's top (glass) face, model mm ──────────
const screenGroup = [...groups.values()].find(g => g.rule.screen && g.parts);
if (screenGroup) {
  let topZ = -Infinity;
  const ups = [];
  for (const t of screenGroup.tris) {
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2];
      const wx = t[i + 6] - t[i], wy = t[i + 7] - t[i + 1], wz = t[i + 8] - t[i + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      if (nz / (Math.hypot(nx, ny, nz) || 1) < 0.9) continue;
      const z = (t[i + 2] + t[i + 5] + t[i + 8]) / 3;
      ups.push([t, i, z]);
      if (z > topZ) topZ = z;
    }
  }
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  for (const [t, i, z] of ups) {
    if (z < topZ - 0.05) continue;
    for (let k = 0; k < 9; k += 3) {
      lo[0] = Math.min(lo[0], t[i + k]); hi[0] = Math.max(hi[0], t[i + k]);
      lo[1] = Math.min(lo[1], t[i + k + 1]); hi[1] = Math.max(hi[1], t[i + k + 1]);
    }
  }
  out += `export const SCREEN = { group:${JSON.stringify(screenGroup.rule.id)}, min:[${lo.map(v => +v.toFixed(3))}], max:[${hi.map(v => +v.toFixed(3))}], z:${+topZ.toFixed(3)} };\n`;
  console.log(`screen     ${(hi[0] - lo[0]).toFixed(1)} x ${(hi[1] - lo[1]).toFixed(1)} mm at z ${topZ.toFixed(2)}`);
} else out += "export const SCREEN = null;\n";

// ── Boot animation (CRWANIM1): u32 JSON length, JSON meta, one raw poster
//    frame of `bpf` bytes, then a zlib stream of every frame ───────────────
const animFile = fs.readdirSync(SRC_DIR).find(f => /\.anim$/i.test(f));
if (animFile) {
  const a = fs.readFileSync(path.join(SRC_DIR, animFile));
  if (a.subarray(0, 8).toString("latin1") !== "CRWANIM1") throw new Error(`${animFile}: not a CRWANIM1 file`);
  const jl = a.readUInt32LE(8);
  const meta = JSON.parse(a.subarray(12, 12 + jl).toString("utf8"));
  const p0 = 12 + jl;
  const poster = a.subarray(p0, p0 + meta.bpf);
  const z = a.subarray(p0 + meta.bpf);
  out += `export const ANIM = { w:${meta.w}, h:${meta.h}, fps:${meta.fps}, frames:${meta.frames}, hold:${meta.hold ?? meta.frames - 1}, ink:${meta.ink ?? 1}, poster:"${poster.toString("base64")}", z:"${z.toString("base64")}" };\n`;
  console.log(`anim       ${animFile}: ${meta.w}x${meta.h}, ${meta.frames} frames @ ${meta.fps} fps`);
} else out += "export const ANIM = null;\n";
fs.writeFileSync(OUT, out);
console.log(`OK  ${OUT}  ${total} edges, ${Math.round(out.length / 1024)} KB`);
