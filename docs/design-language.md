# Design Language Reference — Technical Zine

Concise reference for page agents. All utilities live in `src/styles/global.css`.

---

## Colour Tokens

| Token CSS var    | Light value  | Dark value   | Purpose                         |
|------------------|--------------|--------------|----------------------------------|
| `--background`   | `#faf9f7`    | `#0f1420`    | Page / card base                |
| `--foreground`   | `#22211f`    | `#e8ebf2`    | Body text                       |
| `--accent`       | `#006cac`    | `#ff8c20`    | Blueprint blue / amber — CTAs, active links |
| `--accent-2`     | `#b45309`    | `#6ee7a8`    | Stats, secondary highlights (use sparingly) |
| `--muted`        | `#eceae6`    | `#1a2130`    | Subtle backgrounds, code blocks |
| `--border`       | `#e2dfd8`    | `#2a3145`    | Hairline rules, card edges      |

Tailwind colour aliases (use in classes): `bg-background`, `text-foreground`, `text-accent`,
`text-accent-2`, `bg-muted`, `border-border`.

---

## Typography

- **Headings** — `font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif` (loaded via Google Fonts in `Layout.astro`). Apply inline style or a heading wrapper class.
- **Body** — system sans stack (Tailwind default `font-sans`).
- **Mono micro-labels** — `ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace`.

---

## Utility Classes

### `.t-label`
Mono micro-label: monospace, `0.68rem`, uppercase, `letter-spacing: 0.14em`, muted colour (55 % foreground opacity). Use for section codes (`FIG.01`), figure captions, stat prefixes, small metadata.

```html
<span class="t-label">01 / Projects</span>
<span class="t-label">FIG.02</span>
```

### `.card-hover`
Card recipe: `1px` hairline border (`border-border`), `rounded-xl`, slightly-offset background. On hover/focus-visible: accent-tinted border, soft glow shadow, `translateY(-2px)`. Dark mode: deeper muted background.

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

### `.glow-accent`
Subtle box-shadow glow on hover/focus-visible. Apply to icon buttons, standalone links, or any interactive element that needs a soft pulse without a border.

```html
<button class="glow-accent p-2 rounded-lg">…</button>
```

---

## Retro / Zine Details (use sparingly on main site)

- **Corner tick** — use `before:`/`after:` pseudo-elements with `border-t`/`border-l` at `0.5rem` width on a `relative` card.  
  Example: `before:absolute before:top-2 before:left-2 before:w-2 before:h-2 before:border-t before:border-l before:border-accent/40`
- **Section numbering** — prefix headings with a `.t-label` span: `<span class="t-label mr-2">01 /</span>`.
- **Active nav** — `#nav-menu a.active-nav` is tinted `color: var(--color-accent)` and has a full-width underline rule (1.5 px). Astro `class:list` drives this via `isActive()` in Header.astro.

---

## Shell & Layout

- App max-width: **72 rem** (`max-w-app`). Header, Footer, and `<main>` all use `mx-auto max-w-app px-4`.
- Long-form prose: constrain with `max-w-prose` or `max-w-[70ch]` **inside** the shell; do not change `max-w-app`.
- Globe/writings pages use `HiddenLayout` (no Header/Footer) and full-bleed roots — not affected by the shell.

---

## Scroll Reveal

Add `data-animate` to any element. An `IntersectionObserver` (in `index.astro` and individual pages) adds `.is-visible`, triggering a `translateY(14px) → 0` + `opacity 0 → 1` entrance. Respects `prefers-reduced-motion`.

```html
<article data-animate class="card-hover p-5">…</article>
```

---

## Snippet Examples

**Numbered section heading:**
```html
<h2 class="flex items-baseline gap-3 text-xl font-semibold" style="font-family: 'Space Grotesk', sans-serif;">
  <span class="t-label">02 /</span> Experience
</h2>
```

**Stat badge (accent-2):**
```html
<p class="t-label text-accent-2">↳ 23 % reduction in lap time</p>
```

**Card with corner ticks:**
```html
<article class="card-hover relative p-6
  before:absolute before:top-2.5 before:left-2.5 before:w-2 before:h-2
  before:border-t before:border-l before:border-accent/30
  after:absolute after:bottom-2.5 after:right-2.5 after:w-2 after:h-2
  after:border-b after:border-r after:border-accent/30">
  …
</article>
```

**Dark-mode awareness note:** The `@custom-variant dark` in `global.css` uses `[data-theme=dark]` on `<html>`, NOT the `prefers-color-scheme` media query. Tailwind `dark:` prefix only works correctly because of this variant. Always test in both themes.
