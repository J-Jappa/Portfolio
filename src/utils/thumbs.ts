import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Maps an original image src to its pre-generated thumbnail path.
 * Matches the hash logic in scripts/gen-thumbs.mjs.
 *
 * The filename hashes the SOURCE PATH, so regenerating a thumb (e.g. at a
 * new crop) keeps the same URL. Browsers and the Pages CDN then happily
 * serve the stale cached image. The ?v= param hashes the file CONTENT at
 * build time, so any regeneration busts caches automatically.
 */
export function thumbSrc(src: string): string {
  const name = createHash("md5").update(src).digest("hex").slice(0, 12);
  let v = "";
  try {
    const bytes = readFileSync(`public/thumbs/${name}.webp`);
    v = "?v=" + createHash("md5").update(bytes).digest("hex").slice(0, 8);
  } catch {
    // Thumb not generated yet; serve the bare URL (dev convenience).
  }
  return `/thumbs/${name}.webp${v}`;
}
