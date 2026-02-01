import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string().optional(),  // ISO
    hero: z.string().optional(),  // e.g. "/images/solar/hero.png"
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional()
    })).default([]),
    tags: z.array(z.string()).default([]),
    role: z.string().optional(),
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    outcomes: z.array(z.string()).default([])
  })
});

export const collections = { projects };
