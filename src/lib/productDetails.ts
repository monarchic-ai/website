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
    buyer: "Product teams and agencies that need agents to inspect real web interfaces.",
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
  "mcp-webcomposer": {
    slug: "mcp-webcomposer",
    category: "Web Planning",
    buyer: "Product and design teams that want precise page intent before implementation.",
    useCase: "Define site content, page sections, and layout constraints without mixing those decisions into implementation code.",
    outcomes: [
      "Make required and forbidden content explicit",
      "Choose a responsive page structure before coding",
      "Check that a composition covers the page brief",
    ],
    workflows: ["Site contract", "Page map", "Template selection", "Coverage analysis"],
  },
  "mcp-webimplementer": {
    slug: "mcp-webimplementer",
    category: "Web Implementation",
    buyer: "Teams turning approved web specifications into bounded, reviewable repository changes.",
    useCase: "Translate a validated WebComposer plan into an implementation brief, a scoped patch, and a rendered review loop.",
    outcomes: [
      "Bind page intent to the existing design system",
      "Keep generated changes inside an explicit write scope",
      "Evaluate rendered results before applying the patch",
    ],
    workflows: ["Inspect target", "Prepare execution", "Evaluate rendered page", "Apply approved changes"],
  },
};

export function getProductDetail(slug: string): ProductDetail | null {
  return productDetails[slug] ?? null;
}
