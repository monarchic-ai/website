export interface WorkflowCall {
  tool: string;
  arguments: Record<string, unknown>;
  credits: number;
}

export interface ProductWorkflowProof {
  slug: string;
  title: string;
  request: string;
  calls: WorkflowCall[];
  execution: string;
  output: Record<string, unknown>;
  outputKind: "Exact deterministic output" | "Representative contract excerpt";
  permission: string;
  boundary: string;
  creditCost: number;
  creditExplanation: string;
}

export const productWorkflowProofs: Record<string, ProductWorkflowProof> = {
  "mcp-explicitmem": {
    slug: "mcp-explicitmem",
    title: "Remember a release rule, then retrieve it with provenance",
    request: "Remember that production releases require two reviewers, then prepare the approval constraints.",
    calls: [
      {
        tool: "memory.write_constraint",
        arguments: {
          workspaceId: "demo-workspace",
          scopeId: "project_specific",
          content: "Production releases require two reviewers.",
        },
        credits: 3,
      },
      {
        tool: "memory.retrieve_context",
        arguments: {
          workspaceId: "demo-workspace",
          scopeId: "project_specific",
          task: "Prepare the release approval constraints",
          mode: "task_brief",
          limit: 5,
          tokenBudget: 300,
        },
        credits: 3,
      },
    ],
    execution: "Writes one explicit constraint, retrieves a bounded context packet, and attaches the source event and deterministic context receipt.",
    outputKind: "Representative contract excerpt",
    output: {
      write: {
        eventId: "event-082",
        objectId: "constraint-014",
        action: "created",
        objectType: "constraint",
        canonicalText: "Production releases require two reviewers",
      },
      retrieve: {
        task: "Prepare the release approval constraints",
        mode: "task_brief",
        retrievalMode: "context_pack",
        objectIds: ["constraint-014"],
        contextMarkdown: "Task Context Brief\nTask: Prepare the release approval constraints\n\nAlways-Include Facts:\n- None\n\nFacts:\n- None\n\nHypotheses:\n- None\n\nConstraints:\n- [constraint] Production releases require two reviewers (confidence=0.65)\n\nContested Memory:\n- None\n\nContradictions:\n- None\n\nResolutions:\n- None",
        directEvidence: [
          {
            objectId: "constraint-014",
            objectType: "constraint",
            text: "Production releases require two reviewers",
            sourceEventIds: ["event-082"],
            rank: 1,
            score: 0.4503511301977579,
            confidence: 0.65,
            epistemicStatus: "observed",
            reasons: [
              "semantic=0.24",
              "lexical=0.20",
              "type_boost=+0.07",
              "recency=+0.05",
            ],
          },
        ],
        answerNotes: [
          {
            text: "Constraint evidence: Production releases require two reviewers",
            evidenceObjectIds: ["constraint-014"],
            sourceEventIds: ["event-082"],
          },
        ],
        contextReceiptHash: "sha256:…",
      },
    },
    permission: "Needs an authenticated, entitled account and a write-enabled ExplicitMem tool profile. No external model credential is required for the default local-hash path.",
    boundary: "The caller supplies workspace and scope IDs. They are not yet derived from the authenticated tenant, so use non-sensitive evaluation memory only.",
    creditCost: 6,
    creditExplanation: "3 credits to write + 3 credits to retrieve. Multi-call workflows use the sum of their receipts.",
  },
  "mcp-incidentops": {
    slug: "mcp-incidentops",
    title: "Turn normalized incident evidence into a responder handoff",
    request: "Given this alert, log, deploy, and owner evidence, should we roll back and what should the responder do next?",
    calls: [
      {
        tool: "build_incident_response_packet",
        arguments: {
          evidence: {
            schema: "incidentops.evidence.v1",
            incidentId: "inc-42",
            title: "5xx spike after deploy",
            status: "investigating",
            severity: "sev2",
            startedAt: "2026-08-01T12:00:00Z",
            services: ["api"],
            environments: ["production"],
            alerts: [
              {
                id: "alert-5xx",
                provider: "custom",
                service: "api",
                environment: "production",
                severity: "sev2",
                title: "5xx rate above 5%",
                startedAt: "2026-08-01T12:01:00Z",
                evidence: ["5xx rate exceeded 5% for three data points"],
              },
            ],
            logs: [
              {
                id: "log-1",
                provider: "custom",
                service: "api",
                environment: "production",
                timestamp: "2026-08-01T12:02:00Z",
                level: "error",
                message: "upstream timeout",
              },
            ],
            deploys: [
              {
                id: "deploy-42",
                provider: "github",
                service: "api",
                environment: "production",
                repository: "acme/api",
                commitSha: "abc123",
                startedAt: "2026-08-01T11:54:00Z",
                status: "success",
                rollbackCommand: "gh workflow run rollback-api.yml",
              },
            ],
            ownership: [
              {
                service: "api",
                repository: "acme/api",
                owner: "@platform",
                team: "Platform",
                rollbackHint: "Run the last-known-good deployment workflow.",
              },
            ],
          },
        },
        credits: 1,
      },
    ],
    execution: "Audits the supplied evidence, ranks the current hypothesis, and assembles rollback, recovery, communication, closure, and follow-up artifacts.",
    outputKind: "Representative contract excerpt",
    output: {
      schema: "incidentops.response-packet.v1",
      incidentId: "inc-42",
      generatedAt: "1970-01-01T00:00:00.000Z",
      summary: {
        primaryService: "api",
        severity: "sev2",
        owner: "@platform",
        ownerTeam: "Platform",
        evidenceCounts: { alerts: 1, logs: 1, deploys: 1, owners: 1 },
        currentHypothesis: {
          category: "recent_deploy",
          confidence: "high",
          evidence: ["Deploy deploy-42 completed 6m before incident start."],
        },
        recommendedResponseMode: "rollback",
        rollbackRecommended: true,
        rollbackCommand: "gh workflow run rollback-api.yml",
        readyToClose: false,
        closureBlockers: [
          "Recovery verification complete",
          "Customer and internal communications are current",
        ],
        topAction: {
          rank: 1,
          action: "rollback",
          priority: "critical",
          title: "Rollback api deploy abc123",
          owner: "@platform",
          command: "gh workflow run rollback-api.yml",
          rationale: "A successful deploy completed shortly before incident onset and has an executable rollback command.",
        },
      },
    },
    permission: "This call analyzes request data only. It needs no provider token, filesystem access, ambient AWS access, or write permission.",
    boundary: "Live connector tools have separate request-scoped credential requirements. Guarded provider writes require an explicit execution flag and confirmation phrase.",
    creditCost: 1,
    creditExplanation: "One standard hosted tool call. No provider or stateful-name weight applies to this tool.",
  },
  "mcp-infraprofiler": {
    slug: "mcp-infraprofiler",
    title: "Find the bottleneck in a slow deployment pipeline",
    request: "Why did this deployment take 15 minutes, and what should we fix first?",
    calls: [
      {
        tool: "profile_pipeline",
        arguments: {
          run: {
            id: "gha.acme.api.deploy.42",
            provider: "github_actions",
            repository: "acme/api",
            workflow: "deploy",
            branch: "main",
            trigger: "push",
            totalDurationSeconds: 900,
            stages: [
              { id: "queue", name: "Queue", durationSeconds: 0, queueSeconds: 120 },
              { id: "install", name: "Install", durationSeconds: 360, dependsOn: ["queue"], cache: { key: "deps", hit: false }, networkSeconds: 240 },
              { id: "unit", name: "Unit tests", durationSeconds: 240, dependsOn: ["install"] },
              { id: "deploy", name: "Deploy", durationSeconds: 180, dependsOn: ["unit"] },
            ],
          },
        },
        credits: 1,
      },
    ],
    execution: "Builds the critical path from caller-supplied timing evidence, identifies queue, cache, network, and stage bottlenecks, then projects bounded optimizations.",
    outputKind: "Representative contract excerpt",
    output: {
      run: {
        id: "gha.acme.api.deploy.42",
        provider: "github_actions",
        repository: "acme/api",
        workflow: "deploy",
      },
      totalDurationSeconds: 900,
      criticalPathSeconds: 900,
      criticalPath: [
        { id: "queue", name: "Queue", durationSeconds: 0, queueSeconds: 120 },
        { id: "install", name: "Install", durationSeconds: 360, networkSeconds: 240 },
        { id: "unit", name: "Unit tests", durationSeconds: 240 },
        { id: "deploy", name: "Deploy", durationSeconds: 180 },
      ],
      queueDelaySeconds: 120,
      cacheMisses: 1,
      networkSeconds: 240,
      bottlenecks: [
        {
          stageId: "install",
          stageName: "Install",
          category: "critical_path",
          impactSeconds: 360,
          evidence: "Install contributes 6m to the critical path",
        },
      ],
      estimatedSavingsSeconds: 203,
      optimizedDurationSeconds: 697,
      optimizations: [
        {
          title: "Stabilize dependency and Docker cache keys",
          category: "cache",
          estimatedSavingsSeconds: 113,
          affectedStages: ["install"],
        },
      ],
    },
    permission: "This call only reads the telemetry in the request. It needs no provider token, filesystem, subprocess, Kubernetes, or cloud mutation access.",
    boundary: "Live provider collection is a separate operation and requires a request-scoped read token. Savings are deterministic projections, not guarantees.",
    creditCost: 1,
    creditExplanation: "One standard hosted tool call. The supplied telemetry does not trigger a provider-backed weight.",
  },
  "mcp-releaseops": {
    slug: "mcp-releaseops",
    title: "Verify a tag pack before an operator cuts the tag",
    request: "Can v1.2.0 be tagged from abc123?",
    calls: [
      {
        tool: "releaseops_verify_tag_pack",
        arguments: {
          tag_name: "v1.2.0",
          target_ref: "abc123",
          existing_tags: ["v1.1.0"],
          worktree_clean: true,
        },
        credits: 1,
      },
    ],
    execution: "Checks the supplied tag name, target ref, existing-tag list, and worktree state, then binds the verdict into a deterministic receipt hash.",
    outputKind: "Exact deterministic output",
    output: {
      contract: "releaseops.tag-pack.v1",
      verdict: "PASS",
      tag_name: "v1.2.0",
      target_ref: "abc123",
      worktree_clean: true,
      blockers: [],
      receipt_hash: "2a2f8eda6ba32eba5ec3d1bb6207a918a12caee1c21fa2200d6b7e07f92dd603",
    },
    permission: "No repository, provider, network, subprocess, or mutation access is used. The caller supplies the facts to check.",
    boundary: "The receipt hash detects changed output; it is not a signature. This call does not independently inspect the repository or create a tag.",
    creditCost: 1,
    creditExplanation: "One standard hosted tool call.",
  },
  "mcp-repointel": {
    slug: "mcp-repointel",
    title: "Orient an agent before it changes retrieval code",
    request: "Give me the indexed map of ExplicitMem before I change retrieval.",
    calls: [
      {
        tool: "get_repository_summary",
        arguments: { repo: "explicitmem-mcp-ff694657" },
        credits: 3,
      },
    ],
    execution: "Resolves an already-indexed repository ID and returns its stored summary, entry points, component and workflow counts, and evidence references.",
    outputKind: "Representative contract excerpt",
    output: {
      repoId: "explicitmem-mcp-ff694657",
      name: "ExplicitMem-MCP",
      vcs: ["git", "jj"],
      indexedRevision: "git:9a214d8dce07ea012f555e8964b76ce306bb3c87",
      indexedAt: "2026-08-01T00:36:18.381Z",
      detectedEcosystems: ["node"],
      languages: ["javascript", "json", "markdown", "python", "shell", "typescript", "yaml"],
      documentationPaths: [
        ".monarchic/feature-flags/README.md",
        "datasets/beam/README.md",
        "datasets/locomo/README.md",
        "README.md",
      ],
      summary: "ExplicitMem-MCP is a repository indexed by RepoIntel MCP. Version control: git, jj. Project classification: mcp-server (75% confidence). Detected ecosystems: node. Inventory: 194 files, 129 components, 58 workflows.",
      citations: [
        ".monarchic/feature-flags/README.md",
        "datasets/beam/README.md",
        "datasets/locomo/README.md",
      ],
      metrics: {
        fileCount: 194,
        directoryCount: 19,
        componentCount: 129,
        workflowCount: 58,
        interfaceCount: 2,
        symbolCount: 20381,
      },
    },
    permission: "The repository must already exist in the hosted registry. This read-only call receives no customer provider credential and cannot index or refresh repositories.",
    boundary: "The current hosted registry is shared and repository IDs are caller-supplied. This example uses a pre-indexed public/demo repository; do not use it for private source yet.",
    creditCost: 3,
    creditExplanation: "The current classifier assigns three credits because the tool name contains “summary.”",
  },
};

for (const [slug, proof] of Object.entries(productWorkflowProofs)) {
  if (proof.slug !== slug) {
    throw new Error(`Workflow proof key ${slug} does not match payload slug ${proof.slug}`);
  }
  if (proof.calls.length === 0) {
    throw new Error(`Workflow proof ${slug} must include at least one tool call`);
  }
  const callCredits = proof.calls.reduce((total, call) => total + call.credits, 0);
  if (callCredits !== proof.creditCost) {
    throw new Error(
      `Workflow proof ${slug} declares ${proof.creditCost} credits but its calls total ${callCredits}`,
    );
  }
}

export function getProductWorkflowProof(slug: string): ProductWorkflowProof | null {
  return productWorkflowProofs[slug] ?? null;
}
