#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { workspace } from "./client-workspace.mjs";

const catalogFiles = [
  "pricing.ts",
  "pricing.generated.json",
  "pricing.coming-soon.json",
  "productDetails.ts",
];

let failed = false;

if (workspace.sharedCatalogDir) {
  for (const fileName of catalogFiles) {
    await checkFile("website", fileName, workspace.websiteDir);
    if (workspace.webappDir) {
      await checkFile("monarchic-webapp", fileName, workspace.webappDir);
    }
  }

  await checkManifest("shared product-catalog", {
    manifestDir: workspace.sharedCatalogDir,
    artifactDir: workspace.sharedCatalogDir,
  });
} else {
  console.log("skip   shared catalog byte comparison: sibling shared/product-catalog not found");
}

await checkManifest("website", workspace.websiteDir);
if (workspace.webappDir) {
  await checkManifest("monarchic-webapp", workspace.webappDir);
}
await checkBuildInfoDigestMarker("website", workspace.websiteDir);
if (workspace.webappDir) {
  await checkBuildInfoDigestMarker("monarchic-webapp", workspace.webappDir);
}

if (failed) {
  console.error(
    [
      "",
      "Shared catalog drift check failed.",
      "Edit shared/product-catalog, then run:",
      "  cd monarchic-webapp && pnpm sync:shared-catalog",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("\n[shared-catalog] complete");

async function checkFile(label, fileName, projectDir) {
  const sourcePath = resolve(workspace.sharedCatalogDir, fileName);
  const artifactPath = resolve(projectDir, "src/lib", fileName);
  const sourceContent = await readFile(sourcePath);
  const artifactContent = await readFile(artifactPath);

  if (Buffer.compare(sourceContent, artifactContent) === 0) {
    console.log(`ok     ${label} ${fileName}`);
    return;
  }

  failed = true;
  console.error(
    [
      `drift  ${label} ${fileName}`,
      `       shared   sha256=${digest(sourceContent)}`,
      `       artifact sha256=${digest(artifactContent)}`,
    ].join("\n"),
  );
}

async function checkManifest(label, projectDirOrOptions) {
  const options = typeof projectDirOrOptions === "string"
    ? {
        manifestDir: resolve(projectDirOrOptions, "src/lib"),
        artifactDir: resolve(projectDirOrOptions, "src/lib"),
      }
    : projectDirOrOptions;
  const manifestPath = resolve(options.manifestDir, "catalog.manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    failed = true;
    console.error(`missing or invalid ${label} catalog.manifest.json: ${error.message}`);
    return;
  }

  const files = await Promise.all(catalogFiles.map(async (fileName) => ({
    name: fileName,
    sha256: createHash("sha256")
      .update(await readFile(resolve(options.artifactDir, fileName)))
      .digest("hex"),
  })));
  const expected = {
    schemaVersion: 2,
    source: "shared/product-catalog",
    artifactDigest: `sha256:${createHash("sha256").update(stableStringify(files)).digest("hex")}`,
    files,
  };

  if (JSON.stringify(manifest) === JSON.stringify(expected)) {
    console.log(`ok     ${label} catalog.manifest.json`);
    return;
  }

  failed = true;
  console.error(
    [
      `drift  ${label} catalog.manifest.json`,
      `       expected sha256=${digest(Buffer.from(JSON.stringify(expected)))}`,
      `       actual   sha256=${digest(Buffer.from(JSON.stringify(manifest)))}`,
    ].join("\n"),
  );
}

async function checkBuildInfoDigestMarker(label, projectDir) {
  const buildInfoPath = resolve(projectDir, "src/pages/build-info.json.ts");
  const buildInfo = await readFile(buildInfoPath, "utf8");
  const requiredMarkers = [
    "catalogManifest",
    "manifestDigest: catalogManifest.artifactDigest",
    "artifactSource: catalogManifest.source",
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
  ];
  const missing = requiredMarkers.filter((marker) => !buildInfo.includes(marker));
  if (missing.length === 0) {
    console.log(`ok     ${label} build-info catalog digest markers`);
    return;
  }
  failed = true;
  console.error(`missing ${label} build-info catalog digest markers: ${missing.join(", ")}`);
}

function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 12);
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
