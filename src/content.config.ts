import { defineCollection, z } from "astro:content";
const img = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const row = z.object({
  cols: z.number().int().min(2).max(3).default(2), // 2 or 3 side-by-side
  images: z.array(img).min(2),
});
const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string().optional(),             // ISO date
    hero: z.string().optional(),             // e.g., "/images/solar/hero.png"
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional()
    })).default([]),
    tags: z.array(z.string()).default([]),
    role: z.string().optional(),
    stat: z.string().optional(),           // short headline metric for cards
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    outcomes: z.array(z.string()).default([]),
    order: z.number().default(10),          // ← add this
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),      // hide from the list + route without deleting
    gallery: z.array(z.union([img, row])).default([]),
  })
});

const writings = defineCollection({
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(), // ISO date, e.g. "2025-05-18"
    excerpt: z.string().optional(), // short teaser for the index
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false), // hide from the index without deleting
  }),
});

export const collections = { projects, writings };
