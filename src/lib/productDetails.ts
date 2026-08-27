export interface ProductDetail {
  slug: string;
  category: string;
  buyer: string;
  useCase: string;
  outcomes: string[];
  workflows: string[];
}

export const productDetails: Record<string, ProductDetail> = {
  "monarchic-ai": {
    slug: "monarchic-ai",
    category: "Agent Workflows",
    buyer: "Teams that need long-running agent work to stay observable, reviewable, and connected to account controls.",
    useCase: "Coordinate long-running agent workflows above the hosted MCP catalog while preserving run state, evidence artifacts, and operator review points.",
    outcomes: [
      "Keep multi-step agent work visible across long-running sessions",
      "Attach reviewable artifacts and decisions to each run",
      "Use hosted MCP capabilities through one account-level workflow surface",
    ],
    workflows: ["Launch run", "Monitor progress", "Review artifacts", "Control execution"],
  },
  "mcp-cicd": {
    slug: "mcp-cicd",
    category: "Delivery Operations",
    buyer: "Engineering and platform teams responsible for build, test, and release pipelines.",
    useCase: "Diagnose pipeline failures and delays, evaluate release gates, and trace how delivery changes affect downstream systems.",
    outcomes: [
      "Find queue delays, cache misses, false dependencies, and critical-path bottlenecks",
      "Evaluate release readiness against live provider evidence",
      "Export pipeline architecture for change-impact analysis",
    ],
    workflows: ["Pipeline diagnosis", "Release gates", "Change impact", "Architecture export"],
  },
  "mcp-browserops": {
    slug: "mcp-browserops",
    category: "Browser QA",
    buyer: "Product teams and agencies that need agents to inspect deployed web interfaces.",
    useCase: "Capture browser evidence, screenshots, console failures, network failures, and visible-page assertions.",
    outcomes: [
      "Turn UI claims into reviewable browser observations",
      "Attach screenshots to design and release reviews",
      "Catch visible regressions, console errors, and failed requests",
    ],
    workflows: ["Observe a URL", "Verify a page", "Capture screenshots", "Inspect console and network"],
  },
  "mcp-businessmodel": {
    slug: "mcp-businessmodel",
    category: "Strategy",
    buyer: "Founders, studios, and agent teams turning ideas into scoped ventures.",
    useCase: "Synthesize a company opportunity and hold downstream execution until the business model has been reviewed.",
    outcomes: [
      "Create a reviewable company synthesis",
      "Keep market evidence attached to product decisions",
      "Export a structured company blueprint after approval",
    ],
    workflows: ["Company synthesis", "Gate review", "Blueprint creation", "Market research"],
  },
  "mcp-create-project": {
    slug: "mcp-create-project",
    category: "Project Setup",
    buyer: "Platform teams that want agents to start projects from maintained templates.",
    useCase: "Create a repository scaffold from structured intent without letting each agent improvise the setup.",
    outcomes: [
      "Standardize new projects around known templates",
      "Return clear setup results to the calling agent",
      "Surface scaffold failures instead of hiding partial work",
    ],
    workflows: ["Choose template", "Create project", "Return manifest", "Report failure"],
  },
  "mcp-explicitmem": {
    slug: "mcp-explicitmem",
    category: "Agent Memory",
    buyer: "Teams running agents over long projects where context must survive sessions.",
    useCase: "Store explicit memory objects and retrieve bounded working context without relying on hidden chat history.",
    outcomes: [
      "Persist facts, preferences, goals, and project context",
      "Retrieve relevant context with source evidence",
      "Audit what an agent remembered and how it changed",
    ],
    workflows: ["Write memory", "Search memory", "Retrieve context", "Audit objects"],
  },
  "mcp-incidentops": {
    slug: "mcp-incidentops",
    category: "Incident Response",
    buyer: "Engineering and operations teams coordinating production incidents.",
    useCase: "Combine alerts, deploys, logs, ownership, and response notes into a coherent incident picture.",
    outcomes: [
      "Build an evidence-backed incident timeline",
      "Prepare response, rollback, recovery, and communication plans",
      "Keep provider updates explicit and reviewable",
    ],
    workflows: ["Evidence ingestion", "Incident triage", "Response packet", "Guarded updates"],
  },
  "mcp-infraprofiler": {
    slug: "mcp-infraprofiler",
    category: "Infrastructure Intelligence",
    buyer: "Platform, SRE, and engineering teams reducing infrastructure cost, risk, and delivery latency.",
    useCase: "Connect infrastructure telemetry and pipeline evidence, then rank the bottlenecks that matter most.",
    outcomes: [
      "Prioritize cost, reliability, saturation, and delivery hotspots",
      "Connect pipeline behavior to runtime infrastructure and ownership",
      "Produce architecture graphs and ranked optimization plans",
    ],
    workflows: ["Hotspot ranking", "Cost analysis", "Pipeline profiling", "Architecture export"],
  },
  "mcp-leadgenerator": {
    slug: "mcp-leadgenerator",
    category: "Go-to-Market",
    buyer: "B2B founders and revenue teams working from a defined business model.",
    useCase: "Turn validated business and enrichment data into ranked organizations, buyer personas, people, and outreach angles.",
    outcomes: [
      "Build a focused target-account list",
      "Connect lead recommendations to their source evidence",
      "Prepare buyer-specific outreach angles",
    ],
    workflows: ["Validate enrichment", "Generate targets", "Rank accounts", "Package campaign research"],
  },
  "mcp-pty": {
    slug: "mcp-pty",
    category: "Terminal Control",
    buyer: "Agent platform teams that need observable interactive shell sessions.",
    useCase: "Start and manage terminal sessions through one structured MCP interface.",
    outcomes: [
      "Give agents an interactive terminal surface",
      "Keep command output visible for review",
      "Avoid building custom terminal plumbing for every client",
    ],
    workflows: ["Start session", "Write input", "Read output", "Close session"],
  },
  "mcp-releaseops": {
    slug: "mcp-releaseops",
    category: "Release Management",
    buyer: "Engineering teams coordinating changelogs, artifacts, release checks, and reviewer handoff.",
    useCase: "Turn release readiness into structured checks and exportable review artifacts.",
    outcomes: [
      "Catch documentation drift and missing release evidence",
      "Prepare a reviewer-friendly release pack",
      "Keep release work bounded and auditable",
    ],
    workflows: ["Release readiness", "Changelog scope", "Artifact manifest", "Reviewer pack"],
  },
  "mcp-repo-fleet": {
    slug: "mcp-repo-fleet",
    category: "Repository Operations",
    buyer: "Organizations managing many repositories with agents.",
    useCase: "Inventory repositories and coordinate bounded operations across the fleet.",
    outcomes: [
      "See repository state in one consistent inventory",
      "Coordinate repeatable fleet-wide operations",
      "Receive structured results when an operation fails",
    ],
    workflows: ["Fleet inventory", "Repository sync", "Batch checks", "Failure reporting"],
  },
  "mcp-repointel": {
    slug: "mcp-repointel",
    category: "Repository Intelligence",
    buyer: "Engineering teams using agents across medium and large codebases.",
    useCase: "Give agents repository maps, generated documentation, workflow context, and targeted code evidence.",
    outcomes: [
      "Reduce the time needed to understand an unfamiliar codebase",
      "Ground implementation plans in indexed evidence",
      "Keep architecture and workflow context available across tasks",
    ],
    workflows: ["Repository summary", "Generated wiki", "Evidence lookup", "Workflow discovery"],
  },
  "mcp-seo": {
    slug: "mcp-seo",
    category: "SEO Operations",
    buyer: "Content teams, agencies, and founders running repeatable SEO work.",
    useCase: "Discover routes, inspect live pages, plan internal links, and run ranking-pipeline checks.",
    outcomes: [
      "Replace generic advice with page-specific observations",
      "Prioritize route and internal-link fixes",
      "Repeat the same ranking checks after changes",
    ],
    workflows: ["Route discovery", "Live inspection", "Internal-link planning", "Ranking checks"],
  },
  "mcp-codequality": {
    slug: "mcp-codequality",
    category: "Code Quality",
    buyer: "Engineering teams that want agents to return specific, explainable code-quality findings.",
    useCase: "Analyze supplied source for concrete quality issues, then explain individual findings and practical remediation without requiring repository access.",
    outcomes: [
      "Review code through a bounded source-input interface",
      "Separate quick finding explanations from deeper analysis",
      "Receive structured findings that downstream tools can consume",
    ],
    workflows: ["Submit source", "Analyze quality", "Explain finding", "Review remediation"],
  },
  "mcp-copydev": {
    slug: "mcp-copydev",
    category: "Content Quality",
    buyer: "Product and marketing teams that need precise editing without losing the original voice.",
    useCase: "Edit product copy and identify vague claims, unclear calls to action, and unsupported language before publication.",
    outcomes: [
      "Tighten copy without flattening its tone",
      "Find vague or hard-to-defend claims",
      "Keep review findings separate from the proposed rewrite",
    ],
    workflows: ["Submit copy", "Edit text", "Review vagueness", "Apply revisions"],
  },
  "mcp-nutrition": {
    slug: "mcp-nutrition",
    category: "Health and Nutrition",
    buyer: "Teams building nutrition workflows that need deterministic calculations and explicit constraints.",
    useCase: "Validate nutrition inputs, run deterministic calculations, and build structured plans from stated requirements.",
    outcomes: [
      "Keep calculation inputs and outputs inspectable",
      "Catch incomplete requirements before planning",
      "Build plans from explicit nutrition constraints",
    ],
    workflows: ["Inspect schema", "Validate requirements", "Run calculation", "Build plan"],
  },
  "mcp-codeintel": {
    slug: "mcp-codeintel",
    category: "Code Intelligence",
    buyer: "Engineering teams that need agents to navigate large repositories with live language-server context.",
    useCase: "Keep a durable repository index and warm language-server sessions available for symbol lookup, references, diagnostics, and code navigation.",
    outcomes: [
      "Answer code-navigation questions without rebuilding the index on every call",
      "Use language-server evidence alongside repository structure",
      "Keep each tenant's repositories and sessions isolated",
    ],
    workflows: ["Index repository", "Find symbols", "Trace references", "Inspect diagnostics"],
  },
  "mcp-codeprofiler": {
    slug: "mcp-codeprofiler",
    category: "Code Analysis",
    buyer: "Engineering and platform teams that want repeatable profiling without giving agents an unrestricted shell.",
    useCase: "Detect a repository's stack, choose an appropriate profiling toolbox, and run bounded read-only probes in an isolated job.",
    outcomes: [
      "Choose profiling tools from detected project evidence",
      "Keep expensive analysis out of lightweight discovery calls",
      "Return results and tool failures in one structured report",
    ],
    workflows: ["Detect stack", "Build plan", "Run probes", "Review report"],
  },
  "mcp-orgfleet": {
    slug: "mcp-orgfleet",
    category: "Organization Operations",
    buyer: "Platform teams responsible for repository hygiene and coordinated work across a GitHub organization.",
    useCase: "Inventory organization repositories and run governed clone or sync operations from a management-plane service.",
    outcomes: [
      "See repository state across the organization",
      "Separate read-only checks from mutating fleet operations",
      "Keep a machine-readable record of each fleet action",
    ],
    workflows: ["Inventory organization", "Check drift", "Approve sync", "Review results"],
  },
  "mcp-orgintel": {
    slug: "mcp-orgintel",
    category: "Organization Intelligence",
    buyer: "Engineering leaders and platform teams that need cross-repository analysis rather than one repository at a time.",
    useCase: "Run repository intelligence across a selected organization scope and produce resumable cross-repository reports.",
    outcomes: [
      "Analyze a selected repository fleet as one job",
      "Resume partial work without rerunning completed repositories",
      "Compare findings across repository boundaries",
    ],
    workflows: ["Select scope", "Start analysis", "Resume job", "Export report"],
  },
  "mcp-vectordesign": {
    slug: "mcp-vectordesign",
    category: "Visual Design",
    buyer: "Product and brand teams that want agents to create editable vector assets through a structured interface.",
    useCase: "Build, revise, validate, and export vector artwork while preserving an inspectable design session.",
    outcomes: [
      "Keep vector edits structured and reviewable",
      "Continue related design work across multiple calls",
      "Validate assets before handing them to implementation",
    ],
    workflows: ["Start session", "Build artwork", "Review geometry", "Export asset"],
  },
  "mcp-webdashboard": {
    slug: "mcp-webdashboard",
    category: "Web Planning",
    buyer: "Product teams that need a clear dashboard specification before implementation starts.",
    useCase: "Turn approved site specifications into dashboard hierarchy, component states, responsive behavior, and implementation guidance.",
    outcomes: [
      "Define dashboard structure before code changes begin",
      "Cover loading, empty, error, and populated states",
      "Keep dashboard decisions tied to the approved site contract",
    ],
    workflows: ["Load contract", "Define hierarchy", "Specify states", "Prepare implementation"],
  },
  "mcp-webinfo": {
    slug: "mcp-webinfo",
    category: "Web Research",
    buyer: "Product, content, and design teams that need sourced website decisions before composition work begins.",
    useCase: "Gather website research, retain source evidence, and promote reviewed findings into reusable content decisions.",
    outcomes: [
      "Keep research tied to the pages and sources it came from",
      "Distinguish draft findings from approved decisions",
      "Feed approved evidence into downstream web planning",
    ],
    workflows: ["Collect sources", "Record findings", "Approve decisions", "Publish project context"],
  },
  "mcp-websplash": {
    slug: "mcp-websplash",
    category: "Web Visuals",
    buyer: "Design and product teams that need rendered web visuals and motion assets with implementation metadata.",
    useCase: "Build a structured visual scene, render it in an isolated browser runtime, and export still, motion, or implementation assets.",
    outcomes: [
      "Review rendered output before it reaches a website",
      "Produce still and motion variants from one scene definition",
      "Hand implementation teams assets with clear metadata",
    ],
    workflows: ["Define scene", "Render preview", "Inspect output", "Export bundle"],
  },
};

export function getProductDetail(slug: string): ProductDetail | null {
  return productDetails[slug] ?? null;
}
