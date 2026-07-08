# Photography

Photos are grouped into **roll folders**. Each folder's name carries the
metadata, and every image inside it inherits that location + film stock.
The gallery ([/photography](../../pages/photography.astro)) discovers everything
here automatically — no code to edit.

## Add a roll

1. Create a folder named `<location> · <film>`
   (the separator is a middle dot `·`, with spaces around it).
2. Drop the scans inside — `.jpg`, `.png`, `.tiff`, `.webp`, or `.avif`.

That's it. The page rebuilds the masonry, sizes each photo automatically from
its dimensions, and shows `location · film` on hover.

### Examples

```
src/assets/photography/
├─ Kosciuszko, NSW · Portra 400/
│    ├─ 01.jpg
│    ├─ 02.jpg
│    └─ 03.jpg
└─ Sydney · HP5 Plus/
     ├─ 01.jpg
     └─ 02.jpg
```

### Location filter (grouping by place)

The gallery shows filter chips built from your locations. How a photo is grouped
depends on the part **after the last comma** in its location:

- **Australian shots** (trailing part is a state/territory — `ACT`, `NSW`, `NT`,
  `QLD`, `SA`, `TAS`, `VIC`, `WA`, or `Australia`) stay grouped by their **full
  location**, so `Canberra, ACT` and `Darwin, NT` each get their own chip.
- **Everywhere else** collapses to one chip per **country**, so
  `Chefchaouen, Morocco` and `Marrakech, Morocco` both fall under a single
  `Morocco` chip.

So the comma matters: write `City, Country` (e.g. `Kyoto, Japan`), not
`City Country`. Miss the comma and that roll becomes its own chip instead of
joining its country. The state/territory list lives in
[photography.astro](../../pages/photography.astro) (`AU_REGIONS`) if you ever
want to tweak it, and `SHOW_LOCATION_FILTER` there turns the whole bar off.

### Ordering (optional)

Prefix a folder with a date to control order (newest first). The date is
stripped from the label, so it won't show on the site:

```
2025-05 Kosciuszko, NSW · Portra 400/
2025-03 Sydney · HP5 Plus/
```

### TIFF

TIFF scans are supported — but use the full **`.tiff`** extension, not `.tif`
(Astro only recognises `.tiff`, and a `.tif` in here is ignored with a build
warning telling you to rename it). Astro converts every photo — TIFFs included —
into optimised WebP for the browser, so visitors never download the huge
original. Heads-up: big 16-bit TIFFs make the build noticeably slower and are
large to keep in git, so exporting scans as high-quality JPEG or `.tiff` at a
sane resolution is usually the nicer path.

### Notes

- Only `location`? Name the folder just `Kosciuszko, NSW` (film is optional).
- Spacing around the `·` is forgiving — extra spaces are trimmed off the labels.
- Until you add a real roll, the page shows placeholder tiles so the layout
  isn't blank. They disappear the moment the first real photo lands here.
- Images live in `src/assets/` (not `public/`) so Astro optimises them and can
  read their size — that's what powers the automatic layout.
