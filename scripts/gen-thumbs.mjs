/**
 * gen-thumbs.mjs
 * Reads every project MDX file, finds the first 3 `images` entries,
 * and generates a resized WebP thumbnail at public/thumbs/<hash>.webp.
 * Run with: node scripts/gen-thumbs.mjs
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const THUMB_W = 720;
const THUMB_H = 405;
const QUALITY = 82;
const PUBLIC_DIR = path.resolve("public");
const OUT_DIR = path.join(PUBLIC_DIR, "thumbs");
const CONTENT_DIR = path.resolve("src/content/projects");

fs.mkdirSync(OUT_DIR, { recursive: true });

// Extract image src values from frontmatter (handles both YAML styles)
function extractImageSrcs(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return [];
  const fm = fmMatch[1];

  const srcs = [];
  // Match:  src: "/images/..."  or  { src: "/images/..." ...}
  const re = /src:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(fm)) !== null) {
    srcs.push(m[1]);
  }
  return srcs.slice(0, 3);
}

const mdxFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".mdx"));

let generated = 0;
let skipped = 0;

for (const file of mdxFiles) {
  const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const srcs = extractImageSrcs(content);

  for (const src of srcs) {
    const inputPath = path.join(PUBLIC_DIR, src);
    if (!fs.existsSync(inputPath)) {
      console.warn(`  MISSING  ${src}`);
      continue;
    }

    // Stable output name: hash of the src path so it's reproducible
    const hash = crypto.createHash("md5").update(src).digest("hex").slice(0, 12);
    const outPath = path.join(OUT_DIR, `${hash}.webp`);

    if (fs.existsSync(outPath)) {
      skipped++;
      continue;
    }

    await sharp(inputPath)
      .resize(THUMB_W, THUMB_H, { fit: "cover", position: "centre" })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    console.log(`  OK  /thumbs/${hash}.webp  ←  ${src}`);
    generated++;
  }
}

console.log(`\nDone. ${generated} generated, ${skipped} already up to date.`);
