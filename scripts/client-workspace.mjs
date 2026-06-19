import { existsSync } from "node:fs";
import { resolve } from "node:path";

const websiteRoot = resolve(import.meta.dirname, "..");
const monorepoRoot = resolve(websiteRoot, "..");
const monorepoWebappDir = resolve(monorepoRoot, "monarchic-webapp");
const monorepoWebsiteDir = resolve(monorepoRoot, "website");
const monorepoSharedDir = resolve(monorepoRoot, "shared/product-catalog");

const hasMonorepoClients =
  existsSync(resolve(monorepoWebappDir, "package.json")) &&
  existsSync(resolve(monorepoWebsiteDir, "package.json"));

export const workspace = {
  root: hasMonorepoClients ? monorepoRoot : websiteRoot,
  webappDir: hasMonorepoClients ? monorepoWebappDir : null,
  websiteDir: hasMonorepoClients ? monorepoWebsiteDir : websiteRoot,
  sharedCatalogDir: existsSync(monorepoSharedDir) ? monorepoSharedDir : null,
  hasWebapp: hasMonorepoClients,
  isMonorepo: hasMonorepoClients,
};
