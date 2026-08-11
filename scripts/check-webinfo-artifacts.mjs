#!/usr/bin/env node

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];
const archivePath = "webinfo/monarchic-meta-website.portable.webinfo.json";
const seedPath = "webinfo/monarchic-context-seed.webinfo.json";
const archive = readJson(archivePath);
const seed = readJson(seedPath);
const expectedRoutes = ["/", "/products", "/products/[slug]", "/research", "/research/[slug]", "/company", "/security", "/privacy", "/terms"];

validateEnvelope(archive, archivePath);
validateEnvelope(seed, seedPath);
assert(statSync(resolve(root, archivePath)).size < 2_000_000, "Portable archive must stay below WebInfo's 2 MB import safety limit.");
assert(archive.project.project === "monarchic-meta-website", "Portable archive project id is incorrect.");
assert(archive.project.identity?.name === "Monarchic", "Portable archive must preserve the Monarchic identity.");
assert(archive.project.planningBrief?.status === "approved", "Portable archive must contain the approved planning brief.");
assert(archive.project.approvedSitemapId === "authority-led", "Portable archive must identify the approved sitemap.");
assertSameSet(Object.keys(archive.project.pageBriefs ?? {}), expectedRoutes, "portable page briefs");
assertSameSet(Object.keys(archive.project.pageMaps ?? {}), expectedRoutes, "portable page maps");
assertEmpty(archive.project.operationReceipts, "Portable operation receipts");

assert(seed.project.project === "monarchic-context-seed", "Reusable seed project id is incorrect.");
assert(seed.project.identity?.name === "Monarchic", "Reusable seed must preserve the Monarchic identity.");
assert(seed.project.identity?.audience?.length === 5, "Reusable seed must preserve the five approved audience groups.");
assert(!seed.project.interviewSession, "Reusable seed must start without a site-specific interview session.");
assert(!seed.project.planningBrief, "Reusable seed must not contain a site-specific planning brief.");
assert(!seed.project.approvedSitemapId, "Reusable seed must not select a sitemap.");
assertEmpty(seed.project.sitemapCandidates, "Reusable sitemap candidates");
assert(Object.keys(seed.project.pageBriefs ?? {}).length === 0, "Reusable seed page briefs must be empty.");
assert(Object.keys(seed.project.pageMaps ?? {}).length === 0, "Reusable seed page maps must be empty.");
assertEmpty(seed.project.approvalRecords, "Reusable approval records");
assertEmpty(seed.project.reviewEvents, "Reusable review events");
assertEmpty(seed.project.webComposerRoundTrips, "Reusable WebComposer round trips");
assertEmpty(seed.project.operationReceipts, "Reusable operation receipts");
assert(!seed.project.discoveryAnswers.some((answer) => answer.questionId === "goals.primary_actions"), "Reusable seed must require application-specific goal discovery.");
assert(!seed.project.discoveryAnswers.some((answer) => answer.tags?.includes("goal")), "Reusable seed discovery answers must not pre-satisfy the application-specific goal dimension.");

if (failures.length > 0) {
  console.error("WebInfo artifact validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Validated the portable WebInfo project archive and reusable Monarchic context seed.");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
  } catch (error) {
    console.error(`Could not parse ${path}: ${error.message}`);
    process.exit(1);
  }
}

function validateEnvelope(artifact, label) {
  assert(artifact?.artifactKind === "webinfo.project", `${label} must be a webinfo.project artifact.`);
  assert(artifact?.artifactVersion === 1, `${label} must use artifact version 1.`);
  assert(typeof artifact?.exportedAt === "string" && artifact.exportedAt.length > 0, `${label} must have an export timestamp.`);
  assert(artifact?.project && typeof artifact.project === "object", `${label} must contain a project.`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertEmpty(value, label) {
  assert(Array.isArray(value) && value.length === 0, `${label} must be empty.`);
}

function assertSameSet(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  assert(JSON.stringify(left) === JSON.stringify(right), `${label} mismatch. Expected ${JSON.stringify(right)}, received ${JSON.stringify(left)}.`);
}
