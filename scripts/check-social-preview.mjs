#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const socialPngPath = resolve(process.cwd(), "public/social-card.png");
const socialSvgPath = resolve(process.cwd(), "public/social-card.svg");
const faviconPath = resolve(process.cwd(), "public/favicon.svg");
const seoHeadPath = resolve(process.cwd(), "src/components/SeoHead.astro");
const buildInfoPath = resolve(process.cwd(), "src/pages/build-info.json.ts");
const globalCssPath = resolve(process.cwd(), "src/styles/global.css");

let failed = false;

const [png, socialSvg, favicon, seoHead, buildInfo, globalCss] = await Promise.all([
  readFile(socialPngPath),
  readFile(socialSvgPath, "utf8"),
  readFile(faviconPath, "utf8"),
  readFile(seoHeadPath, "utf8"),
  readFile(buildInfoPath, "utf8"),
  readFile(globalCssPath, "utf8"),
]);

const dimensions = readPngDimensions(png);
if (dimensions.width === 1200 && dimensions.height === 630) {
  ok(`social-card.png dimensions ${dimensions.width}x${dimensions.height}`);
} else {
  fail(`social-card.png expected 1200x630, got ${dimensions.width}x${dimensions.height}`);
}

if (png.length >= 25_000) {
  ok(`social-card.png size ${png.length} bytes`);
} else {
  fail(`social-card.png is too small for a branded preview asset (${png.length} bytes)`);
}

if (socialSvg.includes('viewBox="0 0 1200 630"')) {
  ok("social-card.svg uses 1200x630 viewBox");
} else {
  fail('social-card.svg must use viewBox="0 0 1200 630"');
}

for (const marker of [
  "AI ENGINEERING SYSTEMS.",
  "FROM RESEARCH TO RUNTIME.",
  "INDEPENDENT RESEARCH + DEVELOPMENT",
  "AI AGENTS + MCP INFRASTRUCTURE",
  "LONG-RUNNING AGENT WORK",
  "#7da7d9",
]) {
  if (socialSvg.includes(marker)) {
    ok(`social-card.svg includes ${marker}`);
  } else {
    fail(`social-card.svg missing branded marker: ${marker}`);
  }
}

if (sha256(socialSvg) !== sha256(favicon)) {
  ok("social-card.svg is not the favicon asset");
} else {
  fail("social-card.svg must not duplicate favicon.svg");
}

for (const marker of [
  "/social-card.png?v=6",
  "summary_large_image",
  'og:image:width" content="1200"',
  'og:image:height" content="630"',
  "twitter:image",
]) {
  if (seoHead.includes(marker)) {
    ok(`SeoHead includes ${marker}`);
  } else {
    fail(`SeoHead missing ${marker}`);
  }
}

if (buildInfo.includes('socialImage: "/social-card.png?v=6"')) {
  ok("build-info exposes social-card.png marker");
} else {
  fail("build-info must expose /social-card.png?v=6");
}

for (const marker of [
  "--color-signal: #7da7d9;",
  "--color-signal-soft: #dce8f6;",
  "outline-color: #7da7d9",
]) {
  if (globalCss.includes(marker)) {
    ok(`global brand palette includes ${marker}`);
  } else {
    fail(`global brand palette is missing ${marker}`);
  }
}

for (const retiredColor of ["#f0bd46", "#fff1bd"]) {
  if (!globalCss.includes(retiredColor) && !socialSvg.includes(retiredColor)) {
    ok(`brand surfaces exclude retired yellow ${retiredColor}`);
  } else {
    fail(`brand surfaces still include retired yellow ${retiredColor}`);
  }
}

if (failed) {
  console.error("\n[social-preview] failed");
  process.exit(1);
}

console.log("\n[social-preview] complete");

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`${socialPngPath} is not a PNG file.`);
  }
  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (chunkType !== "IHDR") {
    throw new Error(`${socialPngPath} has no IHDR chunk at the expected offset.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function ok(message) {
  console.log(`ok     ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`fail   ${message}`);
}
