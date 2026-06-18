import { spawn } from "node:child_process";

const host = process.env.MONARCHIC_WEBSITE_LOCAL_HOST ?? "127.0.0.1";
const port = process.env.MONARCHIC_WEBSITE_LOCAL_PORT ?? "4332";
const localUrl = `http://${host}:${port}`;
const expectedCanonicalUrl =
  process.env.MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL ?? "https://monarchic.io";

await run("pnpm", ["build"]);

const preview = spawn("pnpm", ["exec", "astro", "preview", "--host", host, "--port", port], {
  stdio: ["ignore", "pipe", "pipe"],
});

let previewOutput = "";
let previewReady = false;

preview.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  previewOutput += text;
  process.stdout.write(text);
  if (text.includes(localUrl)) {
    previewReady = true;
  }
});

preview.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  previewOutput += text;
  process.stderr.write(text);
});

try {
  await waitForPreview();
  await run("node", ["scripts/smoke-production.mjs"], {
    MONARCHIC_WEBSITE_SMOKE_URL: localUrl,
    MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL: expectedCanonicalUrl,
  });
} finally {
  preview.kill("SIGINT");
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 1500);
    preview.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function run(command, args, extraEnv = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${signal ?? code}`));
    });
  });
}

async function waitForPreview() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error(`preview exited before becoming ready:\n${previewOutput}`);
    }
    if (previewReady && (await isReachable(localUrl))) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`preview did not become ready at ${localUrl}`);
}

async function isReachable(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}
