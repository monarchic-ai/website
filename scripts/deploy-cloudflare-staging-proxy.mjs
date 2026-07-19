#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const apply = process.argv.slice(2).includes("--apply");
const sha = git(["rev-parse", "HEAD"]);
const expectedSha = process.env.MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA;
const args = [
  "--yes",
  "wrangler@4.112.0",
  "deploy",
  "--config",
  "cloudflare/wrangler.staging.jsonc",
];

if (expectedSha && expectedSha !== sha) {
  throw new Error(`checked-out commit ${sha} does not match MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA ${expectedSha}`);
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  worker: "monarchic-website-staging-proxy",
  route: "staging.monarchic.io/*",
  upstream: "website-staging-lac.vercel.app",
  commitSha: sha,
}, null, 2));

if (!apply) {
  args.push("--dry-run");
}
if (apply && process.env.MONARCHIC_WEBSITE_STAGING_PROXY_APPROVED !== "true") {
  throw new Error("--apply requires MONARCHIC_WEBSITE_STAGING_PROXY_APPROVED=true");
}
if (apply && git(["status", "--porcelain"])) {
  throw new Error("staging proxy deploy requires a clean Git checkout");
}

const result = spawnSync("npx", args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  shell: false,
});
if (result.error) console.error(result.error.message);
if (result.status !== 0 || result.error) process.exit(result.status ?? 1);

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}
