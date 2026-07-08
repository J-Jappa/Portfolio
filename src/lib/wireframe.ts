// Renders a slowly rotating wireframe model onto a <canvas>, in the same
// green CRT palette as the photography lightboxes. Orthographic-ish projection
// with a gentle perspective and depth-faded edges so the far side reads dimmer.

export type Wire = { verts: number[][]; edges: number[][] };

type Norm = { verts: number[][]; edges: number[][] };

export function mountWireframe(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  let norm: Norm | null = null;
  let spin = 0.6;
  let raf = 0;
  let running = false;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Centre the model on its bounding box and scale it to a unit-ish radius so
  // any model (placeholder or real) frames itself consistently.
  function setModel(m: Wire | null) {
    if (!m || !m.verts.length) {
      norm = null;
      stop();
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const v of m.verts) {
      minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
      minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
      minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    let r = 0;
    for (const v of m.verts) r = Math.max(r, Math.hypot(v[0] - cx, v[1] - cy, v[2] - cz));
    const s = r > 0 ? 1 / r : 1;
    norm = {
      verts: m.verts.map(v => [(v[0] - cx) * s, (v[1] - cy) * s, (v[2] - cz) * s]),
      edges: m.edges,
    };
    spin = 0.6;
    if (reduced) draw();
    else start();
  }

  function draw() {
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!norm) return;
    const R = Math.min(W, H) * 0.34;
    const ox = W / 2, oy = H / 2;
    const tilt = -0.4;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const cosS = Math.cos(spin), sinS = Math.sin(spin);

    const proj = (v: number[]): [number, number, number] => {
      const x = v[0], y = v[1], z = v[2];
      const x1 = x * cosS + z * sinS;      // yaw about Y
      const z1 = -x * sinS + z * cosS;
      const y2 = y * cosT - z1 * sinT;     // pitch about X
      const z2 = y * sinT + z1 * cosT;
      const p = 1 / (1 + z2 * 0.26);       // mild perspective
      return [ox + x1 * R * p, oy - y2 * R * p, z2];
    };

    ctx.lineCap = "round";
    ctx.lineWidth = 1.15;
    for (const [a, b] of norm.edges) {
      const pa = proj(norm.verts[a]);
      const pb = proj(norm.verts[b]);
      const t = ((pa[2] + pb[2]) / 2 + 1) / 2; // 0 back … 1 front
      ctx.strokeStyle = `rgba(120,255,180,${(0.22 + 0.6 * t).toFixed(3)})`;
      ctx.shadowColor = "rgba(57,255,136,0.55)";
      ctx.shadowBlur = 2 + 5 * t;
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  function frame() {
    if (!running) return;
    spin += 0.012;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  return { setModel, start, stop };
}
