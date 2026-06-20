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
      "rollout controls",
      "Hosted MCPs",
      "Measured Systems",
      "App Surface",
      "Launch Fit",
      "Immediate Access",
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
      "Account Handoff",
      "Buy In App",
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
      "Checkout Access",
      "How To Choose",
      "Bundle Fit",
      "App Checkout",
      "Buy In App",
      "Join Waitlist",
      "Research",
      "App",
      "Pricing Shown In App",
    ],
  },
  {
    label: "product detail source copy",
    path: "src/lib/productDetails.ts",
    requiredText: [
      "accessModel",
      "Hosted on Monarchic-managed infrastructure",
    ],
  },
  {
    label: "coming soon catalog copy",
    path: "src/lib/pricing.coming-soon.json",
    requiredText: [
      "purchase access opens",
      "Purchase access TBD",
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

const forbiddenText = [
  `Self-${"Hosted"}`,
  `self-${"hosted"}`,
  `vps${"Price"}`,
  `${"P"}ilot Readiness`,
  `${"P"}ilot Handoff`,
  `${"Request"} ${"P"}ilot`,
  `${"P"}ilot Terms`,
  `${"P"}ilot Step`,
  `${"P"}ilot Scope`,
  `${"P"}ilot access`,
  `${"p"}ilot setup`,
  `${"paid"} ${"p"}ilot`,
  `Custom ${"P"}ilot ${"Pricing"}`,
  `Pricing ${"TBD"}`,
  `$${"199"}`,
  `$${"149"}`,
  `$${"299"}`,
  `$${"29"}`,
  `$${"99"}`,
  `$${"49"}`,
  `$${"499"}`,
];

let failed = false;

for (const check of checks) {
  const content = await readFile(resolve(process.cwd(), check.path), "utf8");
  for (const marker of forbiddenText) {
    if (content.includes(marker)) {
      failed = true;
      console.error(`forbidden ${check.label}: ${marker} (${check.path})`);
    }
  }
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
