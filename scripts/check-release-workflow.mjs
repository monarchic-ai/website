#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workflowPath = resolve(process.cwd(), ".github/workflows/website-release-smoke.yml");
const content = await readFile(workflowPath, "utf8");

const requiredText = [
  "Website release smoke",
  "include_staging",
  "staging_website_url",
  "staging_expected_canonical_url",
  "pnpm smoke:production",
  "website-production-smoke-report.json",
  "website-staging-smoke-report.json",
  "MONARCHIC_WEBSITE_SMOKE_URL",
  "MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL",
  "MONARCHIC_WEBAPP_SMOKE_URL",
];

let failed = false;

for (const expected of requiredText) {
  if (content.includes(expected)) {
    console.log(`ok     website-release-smoke.yml: ${expected}`);
    continue;
  }
  failed = true;
  console.error(`missing website-release-smoke.yml: ${expected}`);
}

if (failed) {
  console.error("\n[release-workflow] failed");
  process.exit(1);
}

console.log("\n[release-workflow] complete");
