export interface ProductDetail {
  slug: string;
  category: string;
  buyer: string;
  useCase: string;
  outcomes: string[];
  workflows: string[];
  proof: string;
  accessModel: string;
}

export const productDetails: Record<string, ProductDetail> = {
  "mcp-agentfirewall": {
    slug: "mcp-agentfirewall",
    category: "Agent Security",
    buyer: "Teams letting agents call tools, APIs, terminals, or internal MCPs.",
    useCase: "Policy-check agent actions before they reach risky tools.",
    outcomes: [
      "Block prompt-injection-shaped tool calls before execution",
      "Require explicit authority for read, write, execute, and admin actions",
      "Redact sensitive prompt material and verify provenance claims",
    ],
    workflows: ["Tool-call preflight", "Prompt scanning", "Redaction review", "Provenance verification"],
    proof: "Strict MCP input schemas and policy tests cover each public firewall tool.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-browserops": {
    slug: "mcp-browserops",
    category: "Browser QA",
    buyer: "Product teams and agencies that need agents to inspect real web UI.",
    useCase: "Capture browser evidence, screenshots, console failures, network failures, and UI assertions.",
    outcomes: [
      "Turn vague UI claims into receipt-backed browser checks",
      "Attach screenshots and hashes to reviewer bundles",
      "Run deterministic fixture tests before using real Playwright sessions",
    ],
    workflows: ["Observe URL", "Verify URL", "Screenshot receipt", "Console and network checks"],
    proof: "Deterministic CLI, MCP, stdio, contract, receipt, and doctor tests pass.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-businessmodel": {
    slug: "mcp-businessmodel",
    category: "Strategy",
    buyer: "Founders, studios, and agent teams turning ideas into scoped ventures.",
    useCase: "Synthesize company opportunities and gate engineering work until a reviewed business case exists.",
    outcomes: [
      "Create reviewable CompanySynthesisReport artifacts",
      "Block premature repo creation and task generation until approval",
      "Export Monarchic-compatible company blueprints",
    ],
    workflows: ["Company synthesis", "Execution gate review", "Blueprint creation", "Research-backed reports"],
    proof: "Integration coverage verifies draft blocking, approved gates, blueprint creation, and stored resources.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-explicitmem": {
    slug: "mcp-explicitmem",
    category: "Agent Memory",
    buyer: "Teams running agents over long projects where context must survive sessions.",
    useCase: "Give agents explicit durable memory instead of relying on hidden chat history.",
    outcomes: [
      "Persist facts, preferences, and working context across runs",
      "Keep memory operations inspectable through MCP",
      "Separate useful memory from incidental transcript noise",
    ],
    workflows: ["Memory write", "Memory lookup", "Curated recall", "State handoff"],
    proof: "Feature-complete for the bounded memory product surface.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-leadgenerator": {
    slug: "mcp-leadgenerator",
    category: "Go-To-Market",
    buyer: "B2B founders and revenue teams generating leads from a defined business model.",
    useCase: "Build lead targets, personas, ranked organizations, and audit bundles from validated enrichment data.",
    outcomes: [
      "Require validated enrichment before lead generation",
      "Link generation receipts to validation receipts",
      "Produce ranked accounts, buyer personas, people, and outreach angles",
    ],
    workflows: ["Validate enrichment", "Generate lead targets", "Audit report", "Campaign package"],
    proof: "Tests isolate state and verify validated enrichment gates, linked receipts, reports, and audit resources.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-proofpack": {
    slug: "mcp-proofpack",
    category: "Evidence",
    buyer: "Teams that need verifiable receipts for agent work, releases, and artifacts.",
    useCase: "Hash, sign, verify, compare drift, and export reviewable proof packs.",
    outcomes: [
      "Attach artifact hashes to work products",
      "Create receipt bundles reviewers can inspect",
      "Verify receipt integrity after handoff",
    ],
    workflows: ["Hash artifact", "Create receipt", "Verify receipt", "Export evidence pack"],
    proof: "Black-box stdio MCP tests cover initialize, tools/list, hash, create, verify, errors, and recovery.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-pty": {
    slug: "mcp-pty",
    category: "Terminal Control",
    buyer: "Agent platform teams that need governed shell sessions.",
    useCase: "Run and manage terminal sessions through MCP with observable command output.",
    outcomes: [
      "Give agents a bounded execution surface",
      "Preserve output for review",
      "Avoid bespoke terminal plumbing per client",
    ],
    workflows: ["Start session", "Write input", "Read output", "Close session"],
    proof: "Feature-complete for controlled PTY operations.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-releaseops": {
    slug: "mcp-releaseops",
    category: "Release Management",
    buyer: "Engineering teams coordinating changelogs, tags, release checks, and reviewer evidence.",
    useCase: "Turn release readiness into structured checks and exportable artifacts.",
    outcomes: [
      "Catch docs drift and missing release evidence",
      "Produce reviewer-friendly release packs",
      "Keep agent release work bounded and auditable",
    ],
    workflows: ["Release readiness", "Changelog scope", "Artifact manifest", "Export release pack"],
    proof: "Feature-complete for the current release workflow surface.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-repointel": {
    slug: "mcp-repointel",
    category: "Repository Intelligence",
    buyer: "Engineering teams using agents across medium and large codebases.",
    useCase: "Give agents repository maps, wiki context, dependency summaries, and targeted code intelligence.",
    outcomes: [
      "Reduce time lost to codebase orientation",
      "Ground planning in indexed evidence",
      "Expose repo intelligence through MCP instead of ad hoc grep loops",
    ],
    workflows: ["Repo summary", "Generated wiki", "Targeted evidence lookup", "Workflow discovery"],
    proof: "Feature-complete as the repository intelligence backbone used across this workspace.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-seo": {
    slug: "mcp-seo",
    category: "SEO Operations",
    buyer: "Content teams, agencies, and founders that want deterministic SEO workflows.",
    useCase: "Run route discovery, live page inspection, internal-link planning, and ranking-pipeline checks.",
    outcomes: [
      "Replace vague SEO advice with inspectable workflow outputs",
      "Prioritize page and internal-link fixes",
      "Create repeatable ranking-pipeline runs",
    ],
    workflows: ["Route discovery", "Live page inspection", "Internal link planning", "Ranking pipeline"],
    proof: "Feature-complete for deterministic SEO workflows.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-verified": {
    slug: "mcp-verified",
    category: "Patch Verification",
    buyer: "Teams that want agents to patch code without losing test and rollback evidence.",
    useCase: "Plan, apply, and verify bounded patches with proof receipts.",
    outcomes: [
      "Constrain patch scope before mutation",
      "Capture test results as verifier-friendly evidence",
      "Keep rollback and drift checks close to the patch",
    ],
    workflows: ["Plan patch", "Apply bounded change", "Run validation", "Emit proof receipt"],
    proof: "Feature-complete for verified patch workflows.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-outreachconnectors": {
    slug: "mcp-outreachconnectors",
    category: "Governed Outreach",
    buyer: "Revenue teams that need outreach readiness and delivery evidence without unsafe auto-send claims.",
    useCase: "Preflight outreach policy, prepare delivery capture templates, and normalize real provider receipts.",
    outcomes: [
      "Refuse send actions until provider adapters and approval records exist",
      "Normalize provider delivery records without exposing raw contact details",
      "Keep buyer evidence and revenue claims out of delivery receipts",
    ],
    workflows: ["Connector status", "Policy preflight", "Capture template", "Delivery receipt normalization"],
    proof: "MCP server and stdio tests pass for status, preflight, template, send refusal, and receipt recording.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-monarchic": {
    slug: "mcp-monarchic",
    category: "Agent Orchestration",
    buyer: "Teams running governed long-lived agent workflows across repos and infrastructure.",
    useCase: "Expose Monarchic orchestration, run control, artifact discovery, infra launch, and execution gates over MCP.",
    outcomes: [
      "Coordinate local and remote agent runs through one adapter",
      "Block company-building execution until BusinessModel approval gates exist",
      "Expose run summaries, artifacts, registry, control, and follow-up tools",
    ],
    workflows: ["Execute intent", "Review intent", "Run summary", "Infra launch", "Orchestrated campaign"],
    proof: "Full suite passes: 89 unit tests and 15 stdio integration tests.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-create-project": {
    slug: "mcp-create-project",
    category: "Project Creation",
    buyer: "Platform teams that want agents to scaffold projects through governed templates.",
    useCase: "Wrap project creation behind a tested MCP interface instead of letting agents freehand scaffolds.",
    outcomes: [
      "Standardize project creation through known templates",
      "Return structured JSON or readable text outputs",
      "Propagate CLI failures cleanly to callers",
    ],
    workflows: ["Create project JSON", "Create project text", "Template selection", "Failure reporting"],
    proof: "Wrapper tests cover JSON, text, CLI failure propagation, and invalid JSON.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
  "mcp-repo-fleet": {
    slug: "mcp-repo-fleet",
    category: "Repo Operations",
    buyer: "Organizations managing many repositories with agents.",
    useCase: "Expose repo fleet operations through a structured MCP wrapper.",
    outcomes: [
      "Centralize fleet actions behind one MCP route",
      "Return machine-readable fleet outputs",
      "Handle CLI failure and malformed JSON paths predictably",
    ],
    workflows: ["Fleet JSON", "Fleet text", "Repo inventory", "Failure reporting"],
    proof: "Wrapper tests cover JSON, text, CLI failure propagation, and invalid JSON.",
    accessModel: "Hosted on Monarchic-managed infrastructure",
  },
};

export function getProductDetail(slug: string): ProductDetail | null {
  return productDetails[slug] ?? null;
}
