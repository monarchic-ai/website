#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const outputDir = resolve(process.cwd(), "dist");
const extensions = new Set([".html", ".js", ".json"]);
const forbidden = [
  /\bincluded credits?\b/i,
  /\bcredits? each month\b/i,
  /\bper additional credit\b/i,
  /\bcredit overage\b/i,
  /\bone base credit\b/i,
  /\bstarts? at 1 credit\b/i,
  /"includedCredits"/,
  /"creditAllowanceLabel"/,
  /hosted_mcp_credits/i,
  /\/session\/usage-events/i,
];
const forbiddenVisibleCopy = [
  /\breal\b/i,
  /\badult\b/i,
  /\bverified\b/i,
  /\binspect(?:able|ible)\b/i,
  /\bevidence[- ]backed\b/i,
  /\bevidence (?:class(?:es)?|boundary|trail)\b/i,
  /\bworkflow evidence\b/i,
];
const findings = [];

for (const path of walk(outputDir)) {
  if (![...extensions].some((extension) => path.endsWith(extension))) continue;
  const body = readFileSync(path, "utf8");
  for (const pattern of forbidden) {
    const match = pattern.exec(body);
    if (match) {
      findings.push({
        path: path.slice(outputDir.length + 1),
        pattern: pattern.source,
        match: match[0],
      });
    }
  }
  if (path.endsWith(".html")) {
    const text = visibleText(body);
    for (const pattern of forbiddenVisibleCopy) {
      const match = pattern.exec(text);
      if (match) {
        findings.push({
          path: path.slice(outputDir.length + 1),
          pattern: `visible-copy:${pattern.source}`,
          match: match[0],
        });
      }
    }
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `public usage-language leak detected\n${JSON.stringify(findings, null, 2)}\n`,
  );
  process.exit(1);
}

process.stdout.write("public artifacts contain no legacy credit copy or filler credibility labels\n");

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function* walk(path) {
  for (const name of readdirSync(path)) {
    const child = resolve(path, name);
    if (statSync(child).isDirectory()) {
      yield* walk(child);
    } else {
      yield child;
    }
  }
}
