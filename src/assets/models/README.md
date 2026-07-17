# Models

The homepage hero renders the solar car (SC4 Monty) as a three.js x-ray
wireframe of its CFD surface mesh.

## Files

- **`solar-car.obj`** — the CAD export (body shell + three wheels). This is
  the source of truth; drop in a new export to update the car.
- **`solar-car-geo.js`** — auto-generated baked geometry (base64 typed
  arrays), grouped as `top` / `bottom` body shell, `wheelFull`, and
  `wheelTread` (wheels without their end-cap discs). Regenerate after
  changing the OBJ:

  ```sh
  node scripts/gen-car-geo.mjs
  ```

## How it renders

`src/lib/hero-car.ts` decodes the baked groups, normalises them to a shared
scale, and decimates each region at mount time with three.js's
SimplifyModifier — the underside of the pods much harder than the deck and
canopy (`DEC_TOP` 0.42, `DEC_BOTTOM` 0.72, `DEC_WHEEL` 0.34; those are the
density knobs). The result draws as transparent `LineSegments` in the site
accent colour, slowly auto-rotating with drag-to-orbit (OrbitControls, zoom
disabled so page scrolling is never hijacked).

The whole 3D chunk (three.js + mesh) is dynamic-imported only when the hero
container becomes visible, so mobile (where the container is hidden) never
downloads it, and `prefers-reduced-motion` gets a static frame instead of
the auto-rotation.
