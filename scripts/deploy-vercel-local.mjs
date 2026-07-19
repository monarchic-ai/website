#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const apply = process.argv.slice(2).includes("--apply");
const sha = git(["rev-parse", "HEAD"]);
const ref = process.env.VERCEL_GIT_COMMIT_REF ?? git(["rev-parse", "--abbrev-ref", "HEAD"]);
const expectedSha = process.env.MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA;

if (expectedSha && expectedSha !== sha) {
  throw new Error(`checked-out commit ${sha} does not match MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA ${expectedSha}`);
}

const plan = {
  mode: apply ? "apply" : "dry-run",
  project: "website",
  projectId: "prj_uvlSntyUhQQLRpG08KwpGqccIJEp",
  productionUrl: "https://www.monarchic.io",
  commitSha: sha,
  commitRef: ref,
  gitIntegration: "disconnected",
};
console.log(JSON.stringify(plan, null, 2));

if (!apply) {
  console.log("[deploy-vercel-local] ready for operator review; rerun with --apply after production approval");
  process.exit(0);
}
if (process.env.MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED !== "true") {
  throw new Error("--apply requires MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED=true");
}
if (git(["status", "--porcelain"])) {
  throw new Error("production deploy requires a clean Git checkout");
}

const gitEnv = {
  VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ?? "team_PrEo6RnV4WdmfQee8ZufSsGl",
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? plan.projectId,
  VERCEL_ENV: "production",
  VERCEL_URL: process.env.VERCEL_URL ?? "www.monarchic.io",
  VERCEL_GIT_COMMIT_SHA: sha,
  VERCEL_GIT_COMMIT_REF: ref,
  VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "monarchic-ai",
  VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG ?? "website",
};

run(["vercel", "--", "pull", "--yes", "--environment=production"], gitEnv);
run(["vercel", "--", "build", "--prod"], gitEnv);
run(["vercel", "--", "deploy", "--prebuilt", "--prod", "--archive=tgz"], gitEnv);

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function run(args, extraEnv) {
  console.log(`[deploy-vercel-local] pnpm ${args.join(" ")}`);
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    shell: false,
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0 || result.error) process.exit(result.status ?? 1);
}
