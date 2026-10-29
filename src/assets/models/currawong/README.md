# Currawong exploded view

Per-part STL export of the Currawong assembly, baked into
`../currawong-geo.js` for `src/components/CurrawongExplode.astro`.

## Updating the model

1. In SolidWorks, Save As > STL > Options: Binary, Coarse, untick
   "Save all components of an assembly in a single file", tick
   "Do not translate STL output data to positive space".
2. Replace the `.STL` files in this folder with the new export.
3. `node scripts/gen-currawong-geo.mjs` (add `--xray` to write an
   all-triangle bake, `currawong-geo-xray.js`, for the Monty look).

## Boot animation

`currawong_boot.anim` (the device's own CRWANIM1 export) is embedded by the
same script and plays on the display's glass once the model has drawn in,
then holds its end frame. Drop in a new export and re-run the script. The
glass rectangle comes from the display part's top face (`screen: true` on
its rule).

Parts are grouped by filename in the `RULES` table at the top of the
script. Each rule sets the label, the explode offset in mm along the stack
axis (`dz`, + is the front face, `dx` for sideways), and the line style
(`edges` = creases only, `wire` = every triangle). Anything unmatched
lands on the main PCB with a warning.

## Usage

```mdx
import CurrawongExplode from "@/components/CurrawongExplode.astro";

<CurrawongExplode />
<CurrawongExplode length="320svh" stageClass="h-svh" caption="…" />
```

Timeline, camera and opacity knobs live at the top of
`src/lib/currawong-explode.ts`.
