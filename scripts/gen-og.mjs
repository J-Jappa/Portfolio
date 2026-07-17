/**
 * gen-og.mjs
 * Generates the branded Open Graph card (public/og.jpg) in the site's
 * dark "technical zine" palette. Run with: node scripts/gen-og.mjs
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import fs from "fs";

const W = 1200;
const H = 630;

// Palette (matches src/styles/global.css dark theme)
const BG = "#0f1420";
const FG = "#e8ebf2";
const ACCENT = "#ff8c20";
const BORDER = "#2a3145";

async function loadGoogleFont(family, weight, text) {
  const api = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (
    await fetch(api, {
      headers: {
        // Old UA so Google serves truetype (satori can't read woff2)
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!url) throw new Error(`No font URL for ${family}`);
  return await (await fetch(url[1])).arrayBuffer();
}

const NAME = "Jasper Japp";
const SUB = "Engineer · aerodynamics, composites, applied ML";
const LABEL = "SYDNEY, AUSTRALIA · ALWAYS BE OPTIMISING";
const SITE = "jasperjapp.com";

const [grotesk700, grotesk500, mono400] = await Promise.all([
  loadGoogleFont("Space+Grotesk", 700, NAME),
  loadGoogleFont("Space+Grotesk", 500, SUB + SITE),
  loadGoogleFont("IBM+Plex+Mono", 400, LABEL + SITE),
]);

const tick = (pos, borders) => ({
  type: "div",
  props: {
    style: {
      position: "absolute",
      width: "18px",
      height: "18px",
      ...pos,
      ...Object.fromEntries(
        borders.map(b => [`border${b}`, `2px solid ${ACCENT}`])
      ),
    },
  },
});

const svg = await satori(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: BG,
        backgroundImage: `linear-gradient(${BORDER}55 1px, transparent 1px), linear-gradient(90deg, ${BORDER}55 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        padding: "80px",
        position: "relative",
        fontFamily: "Space Grotesk",
      },
      children: [
        tick({ top: "28px", left: "28px" }, ["Top", "Left"]),
        tick({ top: "28px", right: "28px" }, ["Top", "Right"]),
        tick({ bottom: "28px", left: "28px" }, ["Bottom", "Left"]),
        tick({ bottom: "28px", right: "28px" }, ["Bottom", "Right"]),
        {
          type: "div",
          props: {
            style: {
              fontFamily: "IBM Plex Mono",
              fontSize: "22px",
              letterSpacing: "0.18em",
              color: ACCENT,
              marginBottom: "18px",
            },
            children: LABEL,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "104px",
              fontWeight: 700,
              color: FG,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "26px",
            },
            children: NAME,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "34px",
              fontWeight: 500,
              color: `${FG}cc`,
              marginBottom: "54px",
            },
            children: SUB,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontFamily: "IBM Plex Mono",
              fontSize: "24px",
              color: `${FG}88`,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "44px",
                    height: "2px",
                    backgroundColor: ACCENT,
                  },
                },
              },
              { type: "div", props: { children: SITE } },
            ],
          },
        },
      ],
    },
  },
  {
    width: W,
    height: H,
    fonts: [
      { name: "Space Grotesk", data: grotesk700, weight: 700, style: "normal" },
      { name: "Space Grotesk", data: grotesk500, weight: 500, style: "normal" },
      { name: "IBM Plex Mono", data: mono400, weight: 400, style: "normal" },
    ],
  }
);

const png = new Resvg(svg, { fitTo: { mode: "width", value: W } })
  .render()
  .asPng();
await sharp(png).jpeg({ quality: 92 }).toFile("public/og.jpg");
console.log(`OK  public/og.jpg (${W}x${H})`);
