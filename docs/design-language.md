# Design Language Reference: Technical Zine

Concise reference for page agents. All utilities live in `src/styles/global.css`.

---

## Colour Tokens

| Token CSS var    | Light value  | Dark value   | Purpose                         |
|------------------|--------------|--------------|----------------------------------|
| `--background`   | `#faf9f7`    | `#0f1420`    | Page / card base                |
| `--foreground`   | `#22211f`    | `#e8ebf2`    | Body text                       |
| `--accent`       | `#006cac`    | `#ff8c20`    | Blueprint blue / amber, CTAs and active links |
| `--accent-2`     | `#b45309`    | `#6ee7a8`    | Stats, secondary highlights (use sparingly) |
| `--muted`        | `#eceae6`    | `#1a2130`    | Subtle backgrounds, code blocks |
| `--border`       | `#e2dfd8`    | `#2a3145`    | Hairline rules, card edges      |

Tailwind colour aliases (use in classes): `bg-background`, `text-foreground`, `text-accent`,
`text-accent-2`, `bg-muted`, `border-border`.

---

## Typography

- **Headings and body**: `font-family: var(--font-site)`. The typeface is set once, in `--font-site` in `global.css` (currently Times New Roman with a Tinos web-font fallback loaded in `Layout.astro`; previously EB Garamond). Never hardcode a font name in a component.
- **Micro-labels**: `.t-label`, small italic site serif, sentence case, muted. Monospace is reserved for code blocks and the PHOTO//SCOPE terminal pill/card.

---

## Utility Classes

### `.t-label`
Micro-label: italic site serif, `0.85rem`, sentence case, no letter-spacing, muted colour (65 % foreground opacity). Use for captions and dates.

```html
<span class="t-label">Selected work</span>
<span class="t-label">Fig. 2</span>
```

### `.card-hover`
Card recipe: `1px` hairline border (`border-border`), `rounded-xl`, slightly-offset background. On hover/focus-visible: only the border tints accent. No lift, no glow. Dark mode: deeper muted background. Use only for cards that link to a project.

```html
<article class="card-hover p-5">…</article>
<!-- or combined with Tailwind for extra control -->
<a class="card-hover block rounded-xl p-5 no-underline">…</a>
```

### `.u-ink`
Accent-coloured animated underline that grows on `.group` hover. Wrap a parent in `class="group"` and the child text in `class="u-ink"`.

```html
<a href="/project" class="group">
  <span class="u-ink">View project</span>
</a>
```

---

## Do not reintroduce

These patterns were removed from the site because they read as template output, not because they broke anything. Do not add them back.

- **Numbered section labels** (`01 / Selected Work`): nothing on the site is actually numbered or ordered, so the counters were decorative and generic.
- **Double-slash label suffixes** (`EMAIL //`): a dashboard convention, not something a person writes by hand.
- **Corner-tick brackets on cards**: a blueprint flourish repeated on every card made every card look machine-generated.
- **Lat/long or coordinate flourishes**: decorative precision with no connection to the content.
- **Scroll-reveal fade-ups**: the same IntersectionObserver pasted into every page is a template tell.
- **Uppercase letter-spaced labels**: in Garamond this reads like a dashboard wearing a suit.
- **"View project" affordances inside cards that are already links**: redundant, and it duplicates what the whole card already does.
- **Wrapping plain text in cards** (an email, a LinkedIn URL, a status line): a card is for something that links somewhere, plain text does not need a border and a hover state.
- **Eyebrows and subtext** (removed 2026-10-30): no small label above a title (role, year, "Now", "Error 404"), no explanatory line under a heading, no "PDF" tags inside buttons, no captions under thumbnails. The reader is intelligent; a heading and the content are enough. Where a little context is genuinely useful (a project's role and year) it is one plain sentence, not a label.
- **Automatic figure numbering** (`FIG. 01 ·`): nothing in the prose cites a figure by number.
- **Boxed spec sheets** (Role / Date / Tags / Links title blocks): the project header is title, summary and one plain line.
- **Instrument-panel styling on charts and viewers**: no corner ticks, monospace axis text, glowing lines or diamond markers on charts; no title bar label or corner ticks on the lightbox. Charts use the site serif and let the surrounding prose explain them.

---

Exception, by Jasper's call on 2026-10-28: the hero keeps its blueprint grid canvas (`#hero-grid` in `index.astro`, a faint 28px accent grid that drifts a few pixels with the pointer on desktop). The page-wide static graph paper that briefly replaced it was removed; the rest of the page background stays flat.

---

## Shell & Layout

- App max-width: **72 rem** (`max-w-app`). Header, Footer, and `<main>` all use `mx-auto max-w-app px-4`.
- Long-form prose: constrain with `max-w-prose` or `max-w-[70ch]` **inside** the shell; do not change `max-w-app`.
- Globe/writings pages use `HiddenLayout` (no Header/Footer) and full-bleed roots, not affected by the shell.
- **Active nav**: `#nav-menu a.active-nav` is tinted `color: var(--color-accent)` and has a full-width underline rule (1.5 px). Astro `class:list` drives this via `isActive()` in Header.astro.

---

## Snippet Examples

**Section heading:**
```html
<h2 class="text-xl font-semibold tracking-tight" style="font-family: 'EB Garamond', serif;">
  Experience
</h2>
```

**Stat badge (accent-2):**
```html
<p class="t-label text-accent-2">23% reduction in lap time</p>
```

**Dark-mode awareness note:** The `@custom-variant dark` in `global.css` uses `[data-theme=dark]` on `<html>`, NOT the `prefers-color-scheme` media query. Tailwind `dark:` prefix only works correctly because of this variant. Always test in both themes.
