#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];

checkFileIncludes("src/pages/index.astro", [
  "Agent tools that leave evidence.",
  'href="/products"',
  'href="/research"',
  'href="#waitlist"',
  "99.8%",
  "100%",
  "3.45s",
  "3.28s",
  "Quality metrics come from the ExplicitMem benchmark.",
  "Hosted",
  "latency comes from staging MCP route smoke data.",
  "/research/explicitmem",
]);

checkFileIncludes("src/components/WaitlistForm.svelte", [
  "Thanks. You're on the waitlist.",
  "Could not join the waitlist. Try again.",
  "We use this email for Monarchic access updates only.",
]);

checkFileIncludes("webcomposer/site-map.contract.json", [
  "stripe_backed_prices",
  "prices not present in pricing.generated.json",
  "checkout promises for unavailable products",
]);

checkFileIncludes("webcomposer/section-catalog.json", [
  "Show prices only when the generated Stripe catalog exposes the plan as available.",
  "Do not invent prices or checkout promises outside pricing.generated.json.",
]);

checkForbidden("src/pages/index.astro", [
  "sk_live_",
  "sk_test_",
  "whsec_",
]);

if (failures.length > 0) {
  console.error("[webcomposer-contract] failed");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

for (const check of checks) {
  console.log(`ok     ${check}`);
}
console.log("[webcomposer-contract] complete");

function checkFileIncludes(path, markers) {
  const source = read(path);
  for (const marker of markers) {
    if (!source.includes(marker)) {
      failures.push({ path, missing: marker });
    } else {
      checks.push(`${path}: ${marker}`);
    }
  }
}

function checkForbidden(path, markers) {
  const source = read(path);
  for (const marker of markers) {
    if (source.includes(marker)) {
      failures.push({ path, forbidden: marker });
    } else {
      checks.push(`${path}: forbidden ${marker}`);
    }
  }
}

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}
