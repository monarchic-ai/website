#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const scope = process.env.MONARCHIC_VERCEL_SCOPE ?? "monarchic";
const teamId = process.env.MONARCHIC_VERCEL_TEAM_ID ?? "team_PrEo6RnV4WdmfQee8ZufSsGl";
const configPath = resolve(process.env.HOME ?? "", ".local/share/com.vercel.cli/config.json");
const shimPath = resolve(import.meta.dirname, "vercel-ipv4-dns-shim.cjs");
const args = process.argv.slice(2);
if (args[0] === "--") args.shift();

pinCurrentTeam();

const env = {
  ...process.env,
  NODE_OPTIONS: [
    `--require=${shimPath}`,
    "--dns-result-order=ipv4first",
    process.env.NODE_OPTIONS ?? "",
  ].filter(Boolean).join(" "),
  VERCEL_TELEMETRY_DISABLED: process.env.VERCEL_TELEMETRY_DISABLED ?? "1",
};
const commandArgs = ["vercel@latest", ...(args.length > 0 ? args : ["whoami"])];
if (!hasScope(commandArgs) && shouldAddScope(commandArgs)) commandArgs.push("--scope", scope);

const result = spawnSync("npx", commandArgs, {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false,
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);

function pinCurrentTeam() {
  if (process.env.MONARCHIC_VERCEL_SKIP_TEAM_PIN === "true" || !existsSync(configPath)) return;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    if (config.currentTeam === teamId) return;
    config.currentTeam = teamId;
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  } catch (error) {
    console.warn(`[vercel-cli] could not pin Vercel currentTeam: ${error.message}`);
  }
}

function hasScope(values) {
  return values.some((value) => value === "--scope" || value.startsWith("--scope="));
}

function shouldAddScope(values) {
  const [command] = values.slice(1);
  return command !== "whoami" && command !== "login" && command !== "logout";
}
