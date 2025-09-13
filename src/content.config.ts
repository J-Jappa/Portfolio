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
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    outcomes: z.array(z.string()).default([]),
    order: z.number().default(10),          // ← add this
    featured: z.boolean().default(false),
    gallery: z.array(z.union([img, row])).default([]),
  })
});

export const collections = { projects };
