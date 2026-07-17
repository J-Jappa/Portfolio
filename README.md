# Jasper Japp — Portfolio

My personal engineering portfolio: projects, write-ups, and a deliberately hidden retro-futurist photography section. Built with [Astro](https://astro.build) and Tailwind CSS, and shipped as a static site.

**Live:** <https://jasperjapp.com>

## Stack

- **Astro** static site generation, with **MDX** for project and writing content
- **Tailwind CSS v4**
- Light/dark theme, view transitions, and a sitemap
- A hand-rolled 2D-canvas photography visualiser (the "PHOTO//SCOPE" wireframe globe) with no 3D library — see [`src/pages/photoscope.astro`](src/pages/photoscope.astro)

## Getting started

```bash
npm install
npm run dev        # dev server (localhost:4321)
npm run build      # type-check + static build to ./dist
npm run preview    # serve the built site
```

## Content

Projects and writings are Astro content collections (`src/content/`), authored in MDX. Site-wide settings (title, author, socials, locale) live in [`src/config.ts`](src/config.ts).

- **Projects** — `src/content/projects/*.mdx`. Frontmatter (`title`, `summary`, `date`, `tags`, `outcomes`, `images`, `order`, `featured`, …) is defined in [`src/content.config.ts`](src/content.config.ts). Listed on the home page and rendered at `/projects/<slug>/`.
- **Writings** — `src/content/writings/*.mdx`, rendered at `/writings/<slug>/`.

### Photography

The photography pages auto-discover images from roll folders under `src/assets/photography/`, each named `Place, Country · Film Stock · Camera`. The naming rules and options are documented in [`src/assets/photography/README.md`](src/assets/photography/README.md); location coordinates for the globe live in [`src/data/locations.ts`](src/data/locations.ts). These pages aren't linked from the main nav.

## Structure

```text
src/
├── assets/         # images, icons, photography rolls
├── components/     # UI components
├── content/        # projects + writings (MDX collections)
├── data/           # geo + location data for the globe
├── layouts/        # page layouts
├── lib/            # canvas wireframe renderer
├── pages/          # routes
└── styles/         # global + typography CSS
public/             # static assets (icons, OG image, thumbnails, CV, videos)
```

## Deployment

`npm run build` produces a static `./dist`, deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

Originally bootstrapped from the [AstroPaper](https://github.com/satnaing/astro-paper) theme (MIT), since heavily rebuilt.
