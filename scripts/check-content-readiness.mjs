#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const checks = [
  {
    label: "homepage launch positioning",
    path: "src/pages/index.astro",
    requiredText: [
      "Hosted MCPs",
      "Built To Run",
      "hosted MCP routes",
      "account-scoped API access",
      "production code",
      "customer workflows",
      "rollout handoff",
      "Hosted MCPs",
      "Measured Systems",
      "App Surface",
      "Launch Fit",
      "Pilot Readiness",
      "Environment",
      "Evidence",
      "Handoff",
      "What Ships",
      "Hosted route",
      "Owner record",
      "Evidence pack",
      "Exit criteria",
      "one account, one workflow",
      "Best Fit",
      "Not A Fit",
      "Pilot Handoff",
      "pilot scope",
      "Request Pilot",
      "App",
      "BrowserOps",
      "ExplicitMem",
      "RepoIntel",
    ],
  },
  {
    label: "products index launch copy",
    path: "src/pages/products/index.astro",
    requiredText: [
      "Tools Agents",
      "Can Actually Use",
      "Pilot Pricing",
      "How To Choose",
      "Bundle Fit",
      "Pilot Handoff",
      "Request Pilot",
      "Join Waitlist",
      "Research",
      "App",
      "Custom Pilot Pricing",
    ],
  },
  {
    label: "research index evidence copy",
    path: "src/pages/research/index.astro",
    requiredText: [
      "Systems Under",
      "Measurement",
      "Open Research",
      "Product Page",
      "App",
      "benchmark-scoped research notes",
      "Scores are useful",
      "/research/browserops",
      "/research/explicitmem",
      "/research/repointel",
    ],
  },
];

let failed = false;

for (const check of checks) {
  const content = await readFile(resolve(process.cwd(), check.path), "utf8");
  for (const marker of check.requiredText) {
    if (content.includes(marker)) {
      console.log(`ok     ${check.label}: ${marker}`);
      continue;
    }
    failed = true;
    console.error(`missing ${check.label}: ${marker} (${check.path})`);
  }
}

if (failed) {
  console.error("\n[content-readiness] failed");
  process.exit(1);
}

console.log("\n[content-readiness] complete");
