#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const projects = {
  development: {
    project: "website-dev",
    projectId: "prj_e4J5a33B446Ifj75XrJKpwuvjAQp",
    url: "website-dev-monarchic.vercel.app",
    canonicalUrl: "https://website-dev-monarchic.vercel.app",
    apiBaseUrl: "https://dev-api.monarchic.io",
    // A dedicated remote development webapp does not exist yet. Keep this
    // public preview on the non-production app instead of crossing into prod.
    webappBaseUrl: "https://staging-app.monarchic.io",
    productionAlias: "website-dev-monarchic.vercel.app",
  },
  production: {
    project: "website",
    projectId: "prj_uvlSntyUhQQLRpG08KwpGqccIJEp",
    url: "www.monarchic.io",
    canonicalUrl: "https://monarchic.io",
    apiBaseUrl: "https://api.monarchic.io",
    webappBaseUrl: "https://app.monarchic.io",
    productionAlias: "website-monarchic.vercel.app",
  },
  staging: {
    project: "website-staging",
    projectId: "prj_2fPB376hEAE3blFj67hsA3jc1Tme",
    url: "staging.monarchic.io",
    canonicalUrl: "https://staging.monarchic.io",
    apiBaseUrl: "https://staging-api.monarchic.io",
    webappBaseUrl: "https://staging-app.monarchic.io",
    productionAlias: "website-staging-monarchic.vercel.app",
  },
};

const apply = process.argv.slice(2).includes("--apply");
const target = process.env.MONARCHIC_VERCEL_PROJECT ?? "production";
if (!Object.hasOwn(projects, target)) {
  throw new Error(`MONARCHIC_VERCEL_PROJECT must be development, staging, or production, got ${target}`);
}

const project = projects[target];
const sha = git(["rev-parse", "HEAD"]);
const ref = process.env.VERCEL_GIT_COMMIT_REF ?? git(["rev-parse", "--abbrev-ref", "HEAD"]);
const expectedSha = process.env.MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA;

if (expectedSha && expectedSha !== sha) {
  throw new Error(`checked-out commit ${sha} does not match MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA ${expectedSha}`);
}

const plan = {
  mode: apply ? "apply" : "dry-run",
  target,
  project: project.project,
  projectId: project.projectId,
  url: `https://${project.url}`,
  commitSha: sha,
  commitRef: ref,
  gitIntegration: "disconnected",
  canonicalUrl: project.canonicalUrl,
  apiBaseUrl: project.apiBaseUrl,
  webappBaseUrl: project.webappBaseUrl,
};
console.log(JSON.stringify(plan, null, 2));

if (!apply) {
  console.log("[deploy-vercel-local] ready for operator review; rerun with --apply after target approval");
  process.exit(0);
}
if (target === "production" && process.env.MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED !== "true") {
  throw new Error("--apply requires MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED=true");
}
if (git(["status", "--porcelain"])) {
  throw new Error(`${target} deploy requires a clean Git checkout`);
}

for (const path of ["dist", ".vercel/output"]) {
  rmSync(resolve(process.cwd(), path), { recursive: true, force: true });
}

const gitEnv = {
  VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ?? "team_PrEo6RnV4WdmfQee8ZufSsGl",
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? project.projectId,
  VERCEL_ENV: "production",
  VERCEL_URL: process.env.VERCEL_URL ?? project.url,
  VERCEL_GIT_COMMIT_SHA: sha,
  VERCEL_GIT_COMMIT_REF: ref,
  VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "monarchic-ai",
  VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG ?? "website",
  PUBLIC_MONARCHIC_WEBSITE_BASE_URL: project.canonicalUrl,
  PUBLIC_MONARCHIC_API_BASE_URL: project.apiBaseUrl,
  PUBLIC_MONARCHIC_WEBAPP_BASE_URL: project.webappBaseUrl,
};

run(["vercel", "--", "pull", "--yes", "--environment=production"], gitEnv);
run(["vercel", "--", "build", "--prod"], gitEnv);
run(["vercel", "--", "deploy", "--prebuilt", "--prod", "--archive=tgz"], gitEnv);
run(
  ["vercel", "--", "promote", project.productionAlias, "--yes"],
  gitEnv,
  { allowAlreadyCurrent: true },
);

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function run(args, extraEnv, options = {}) {
  console.log(`[deploy-vercel-local] pnpm ${args.join(" ")}`);
  const captureOutput = options.allowAlreadyCurrent === true;
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    encoding: captureOutput ? "utf8" : undefined,
    stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: false,
  });
  if (captureOutput) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error) console.error(result.error.message);
  if (result.status !== 0 || result.error) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (options.allowAlreadyCurrent === true
      && output.includes("already the current production deployment")) {
      console.log("[deploy-vercel-local] deployment is already current");
      return;
    }
    process.exit(result.status ?? 1);
  }
}
