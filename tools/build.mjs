// Build: copies the static site into dist/, self-hosts the fonts, converts the
// robot's "FTB" label to vector paths, and renders the social preview image
// (og.png) and the Apple touch icon. Run with: npm run build
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "dist");
const FS = path.join(ROOT, "node_modules/@fontsource");
const r = (...p) => path.join(ROOT, ...p);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "assets/fonts"), { recursive: true });

// 1. static files
for (const f of ["index.html", "styles.css", "main.js", "config.js", "robots.txt", "sitemap.xml", "_headers"]) {
  fs.copyFileSync(r(f), path.join(OUT, f));
}
// fill in the public URL used for canonical/OG tags (set SITE_URL in the host's env vars)
const SITE_URL = (process.env.SITE_URL || "https://free-the-bots.pages.dev").replace(/\/$/, "");
for (const f of ["index.html", "robots.txt", "sitemap.xml"]) {
  const fp = path.join(OUT, f);
  fs.writeFileSync(fp, fs.readFileSync(fp, "utf8").replaceAll("__SITE_URL__", SITE_URL));
}
// copy everything in assets/ (drop your artwork here: robot.svg / robot.png / robot.webp ...)
for (const f of fs.readdirSync(r("assets"))) {
  if (fs.statSync(r("assets", f)).isFile()) fs.copyFileSync(r("assets", f), path.join(OUT, "assets", f));
}

// 2. self-hosted fonts (SIL Open Font License)
const fonts = {
  "anton-latin-400-normal.woff2": "anton",
  "space-mono-latin-400-normal.woff2": "space-mono",
  "space-mono-latin-700-normal.woff2": "space-mono",
};
for (const [file, pkg] of Object.entries(fonts)) {
  fs.copyFileSync(path.join(FS, pkg, "files", file), path.join(OUT, "assets/fonts", file));
}
fs.copyFileSync(path.join(FS, "anton/LICENSE"), path.join(OUT, "assets/fonts/OFL-LICENSE.txt"));

// 3. text -> vector paths helper
const anton = opentype.parse(toAB(fs.readFileSync(path.join(FS, "anton/files/anton-latin-400-normal.woff"))));
const mono = opentype.parse(toAB(fs.readFileSync(path.join(FS, "space-mono/files/space-mono-latin-700-normal.woff"))));
function toAB(buf) { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); }
function textPath(font, text, x, y, size, fill, letterSpacing = 0) {
  // per-glyph layout (no shaping needed for these short uppercase strings)
  const scale = size / font.unitsPerEm;
  let cx = x, d = "";
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    d += g.getPath(cx, y, size).toPathData(1);
    cx += g.advanceWidth * scale + letterSpacing;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
function textWidth(font, text, size, letterSpacing = 0) {
  const scale = size / font.unitsPerEm;
  let w = 0;
  for (const ch of text) w += font.charToGlyph(ch).advanceWidth * scale + letterSpacing;
  return w - letterSpacing;
}

// 4. robot artwork: swap the <text> label for paths so it renders in Anton everywhere
const hasSvgRobot = fs.existsSync(r("assets/robot.svg"));
let robot = hasSvgRobot ? fs.readFileSync(r("assets/robot.svg"), "utf8") : "<svg></svg>";
const lw = textWidth(anton, "FTB", 36, 2);
robot = robot.replace(/<text[^>]*>FTB<\/text>/, textPath(anton, "FTB", 300 - lw / 2, 513, 36, "#ffd23f", 2));
if (hasSvgRobot) fs.writeFileSync(path.join(OUT, "assets/robot.svg"), robot);

// 5. social preview image, 1200x630
const robotInner = robot.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const head = [];
for (const [dx, c] of [[10, "#000"], [5, "#e10600"], [0, "#ffd23f"]]) {
  head.push(textPath(anton, "FREE", 70 + dx, 220 + dx, 168, c));
  head.push(textPath(anton, "THE BOTS", 70 + dx, 375 + dx, 168, c));
}
const autoW = textWidth(mono, "AUTOMATED.", 27, 2);
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="og-glow" cx="78%" cy="50%" r="55%"><stop offset="0" stop-color="#ff7a00" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/></radialGradient>
    <pattern id="og-stripes" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="28" fill="#e10600" opacity=".15"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect width="1200" height="630" fill="url(#og-stripes)"/>
  <rect width="1200" height="630" fill="url(#og-glow)"/>
  ${hasSvgRobot ? `<svg x="620" y="30" width="570" height="570" viewBox="0 0 600 600">${robotInner}</svg>` : ""}
  ${head.join("")}
  ${textPath(mono, "THE REVOLUTION WILL BE", 72, 440, 27, "#f4efe6", 2)}
  <rect x="70" y="456" width="${Math.round(autoW + 28)}" height="44" fill="#e10600"/>
  ${textPath(mono, "AUTOMATED.", 84, 488, 27, "#f4efe6", 2)}
  ${textPath(mono, "$FTB / SOLANA MEME COIN", 72, 560, 22, "#ff7a00", 2)}
</svg>`;
fs.writeFileSync(path.join(OUT, "assets/og.png"), new Resvg(og, { font: { loadSystemFonts: false } }).render().asPng());

// 6. apple touch icon
const icon = fs.readFileSync(r("assets/favicon.svg"), "utf8");
fs.writeFileSync(path.join(OUT, "assets/apple-touch-icon.png"),
  new Resvg(icon, { fitTo: { mode: "width", value: 180 }, font: { loadSystemFonts: false } }).render().asPng());

console.log("Built dist/:", fs.readdirSync(OUT).join(", "));
