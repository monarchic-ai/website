#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const catalogFiles = [
  "pricing.ts",
  "pricing.generated.json",
  "pricing.coming-soon.json",
  "productDetails.ts",
];
const libDir = resolve(process.cwd(), "src/lib");
const manifestPath = resolve(libDir, "catalog.manifest.json");
const buildInfoPath = resolve(process.cwd(), "src/pages/build-info.json.ts");

let failed = false;

const manifest = await readJson(manifestPath);
const expectedFiles = await Promise.all(catalogFiles.map(async (fileName) => {
  const content = await readFile(resolve(libDir, fileName));
  return {
    name: fileName,
    sha256: sha256(content),
  };
}));
const expectedManifest = {
  schemaVersion: 3,
  source: "shared/product-catalog",
  generatedArtifact: true,
  generatedBy: "monarchic-webapp/scripts/sync-shared-catalog.mjs",
  deployableCopies: [
    "monarchic-webapp/src/lib",
    "website/src/lib",
  ],
  artifactDigest: `sha256:${sha256(stableStringify(expectedFiles))}`,
  files: expectedFiles,
};

if (JSON.stringify(manifest) === JSON.stringify(expectedManifest)) {
  ok("catalog.manifest.json matches generated catalog files");
} else {
  fail("catalog.manifest.json does not match generated catalog files");
  console.error(`       expected sha256=${sha256(JSON.stringify(expectedManifest))}`);
  console.error(`       actual   sha256=${sha256(JSON.stringify(manifest))}`);
}

for (const file of expectedFiles) {
  const entry = manifest.files?.find((candidate) => candidate?.name === file.name);
  if (entry?.sha256 === file.sha256) {
    ok(`${file.name} sha256 ${file.sha256.slice(0, 12)}`);
  } else {
    fail(`${file.name} missing or stale in catalog.manifest.json`);
  }
}

if (/^sha256:[a-f0-9]{64}$/.test(manifest.artifactDigest ?? "")) {
  ok(`artifactDigest ${manifest.artifactDigest}`);
} else {
  fail("catalog.manifest.json missing aggregate artifactDigest");
}

const buildInfo = await readFile(buildInfoPath, "utf8");
for (const marker of [
  "catalogManifest",
  "manifestDigest: catalogManifest.artifactDigest",
  "artifactSource: catalogManifest.source",
  "artifactGenerated: catalogManifest.generatedArtifact",
  "artifactGeneratedBy: catalogManifest.generatedBy",
  "artifactDeployableCopies: catalogManifest.deployableCopies",
  "artifactDigest: await catalogArtifactDigest()",
  "artifactFiles",
  "artifactFileHashes",
  "deployment",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_REPO_OWNER",
  "VERCEL_GIT_REPO_SLUG",
  "VERCEL_ENV",
  "VERCEL_URL",
  '"pricing.ts"',
  '"pricing.generated.json"',
  '"pricing.coming-soon.json"',
  '"productDetails.ts"',
]) {
  if (buildInfo.includes(marker)) {
    ok(`build-info includes ${marker}`);
  } else {
    fail(`build-info missing ${marker}`);
  }
}

if (failed) {
  console.error("\n[catalog-artifact] failed");
  process.exit(1);
}

console.log("\n[catalog-artifact] complete");

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`missing or invalid ${path}: ${error.message}`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function ok(message) {
  console.log(`ok     ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`fail   ${message}`);
}
