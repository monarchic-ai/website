export interface WorkflowCall {
  tool: string;
  arguments: Record<string, unknown>;
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
  usageExplanation: string;
}

export const productWorkflowProofs: Record<string, ProductWorkflowProof> = {
  "mcp-browserops": {
    slug: "mcp-browserops",
    title: "Open a page and return browser evidence",
    request: "Check the example page and return what a browser can actually observe.",
    calls: [{
      tool: "browser_observe_url",
      arguments: {
        url: "https://example.com",
        safety_boundaries: [
          "no credential theft",
          "no CAPTCHA bypass",
          "no stealth scraping",
          "no unrestricted automation",
          "bounded task context required",
        ],
      },
    }],
    execution: "Starts an isolated browser task, loads one bounded URL, and returns an observation receipt with page and runtime evidence.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "browserops.observation_receipt.v1.0",
      url: "https://example.com/",
      title: "Example Domain",
      status: "observed",
      evidence: { screenshotCaptured: true, consoleErrors: 0, failedRequests: 0 },
    },
    permission: "Requires an authenticated, entitled account. The browser task receives only the bounded request context supplied for this call.",
    boundary: "BrowserOps does not bypass access controls, CAPTCHAs, or site policy. Authenticated browsing requires an approved credential flow.",
    usageExplanation: "Browser calls receive a measured runtime receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-businessmodel": {
    slug: "mcp-businessmodel",
    title: "Check the company-synthesis service before starting work",
    request: "Confirm that the business-model service and its required contracts are ready.",
    calls: [{ tool: "businessmodel_health", arguments: {} }],
    execution: "Runs the read-only hosted health contract and reports whether the synthesis workflow is ready to accept a governed request.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "businessmodel.health.v1",
      status: "ok",
      synthesisAvailable: true,
      gateReviewAvailable: true,
    },
    permission: "Requires an authenticated, entitled account. This health call uses no provider credential and writes no company state.",
    boundary: "Health confirms service readiness; it does not approve a company synthesis or open downstream execution gates.",
    usageExplanation: "The completed health call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-cicd": {
    slug: "mcp-cicd",
    title: "Diagnose a delivery pipeline from bounded evidence",
    request: "Show me the likely bottlenecks and release risks in the demo pipeline.",
    calls: [{ tool: "diagnose_pipeline_run", arguments: {} }],
    execution: "Runs the deterministic demonstration diagnosis and returns stage, dependency, and release-gate findings without contacting a provider.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "cicd-mcp.pipeline-diagnosis.v1",
      status: "complete",
      findings: ["critical-path stage identified", "release evidence gap identified"],
      providerCalls: 0,
    },
    permission: "Requires an authenticated, entitled account. The demonstration call needs no GitHub, GitLab, or cloud credential.",
    boundary: "Live pipeline collection is a separate operation and requires a request-scoped read credential.",
    usageExplanation: "The diagnosis receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-codequality": {
    slug: "mcp-codequality",
    title: "Review supplied source without cloning a repository",
    request: "Find the low-effort quality problems in this parser.",
    calls: [{
      tool: "analyze_inline_sources",
      arguments: {
        files: [{
          path: "src/parser.ts",
          content: "export function parse(raw: string) { return JSON.parse(raw); }\n",
        }],
        lowHangingFruitOnly: true,
        maxFindings: 10,
      },
    }],
    execution: "Analyzes only the supplied source payload and returns a bounded list of structured findings.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "codequality.inline-analysis.v1",
      filesAnalyzed: 1,
      findingCount: 1,
      findings: [{ path: "src/parser.ts", category: "error-handling", severity: "medium" }],
    },
    permission: "Requires an authenticated, entitled account. The call receives inline source and does not need repository or provider access.",
    boundary: "The analysis covers only the submitted files and cannot infer repository-wide behavior from missing code.",
    usageExplanation: "The completed analysis receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-copydev": {
    slug: "mcp-copydev",
    title: "Find vague language before copy reaches production",
    request: "Tell me which claims in this product sentence are too vague to defend.",
    calls: [{
      tool: "copy_review_detect_vagueness",
      arguments: {
        text: "Unlock seamless growth with a powerful next-generation platform.",
        product: "Example product",
        audience: "founders",
      },
    }],
    execution: "Runs a deterministic language review and returns the vague phrases, why they are weak, and what evidence would make them specific.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "copydev.vagueness-report.v1",
      verdict: "revise",
      phrases: ["seamless growth", "powerful", "next-generation"],
    },
    permission: "Requires an authenticated, entitled account. The call reads only the copy in the request.",
    boundary: "The review identifies language problems; it does not verify product claims or publish changes.",
    usageExplanation: "The completed review receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-create-project": {
    slug: "mcp-create-project",
    title: "Check the governed scaffold service before creation",
    request: "Confirm that maintained templates and the read-only hosted profile are healthy.",
    calls: [{ tool: "create_project_health", arguments: {} }],
    execution: "Checks the hosted project-creation contract and reports template and policy readiness without creating a repository.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "create-project.health.v1",
      status: "ok",
      hostedMode: "readonly",
      templatesAvailable: true,
    },
    permission: "Requires an authenticated, entitled account. This call performs no filesystem or provider mutation.",
    boundary: "Project creation remains a separately governed operation with an explicit destination and write policy.",
    usageExplanation: "The health call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-leadgenerator": {
    slug: "mcp-leadgenerator",
    title: "Score a supplied account against a defined offer",
    request: "Rank this software company against the supplied hosted-MCP offer.",
    calls: [{
      tool: "score_provided_leads",
      arguments: {
        business_model_report: {
          company_name: "Example vendor",
          offerings: ["Hosted MCP operations"],
          customers: ["Software teams"],
          go_to_market_motion: ["Self-service"],
        },
        provided_organizations: [{
          company_name: "Example Systems",
          industry: "Software",
          notes: "Evaluating agent infrastructure",
        }],
        max_accounts: 1,
      },
    }],
    execution: "Scores only the supplied organization against the supplied business model and returns its fit evidence without live enrichment.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "leadgenerator.provided-lead-score.v1",
      accountCount: 1,
      accounts: [{ companyName: "Example Systems", fit: "high", evidenceSource: "provided" }],
    },
    permission: "Requires an authenticated, entitled account. The hosted read-only profile disables live enrichment for this call.",
    boundary: "A supplied-data score is research support, not proof that a person or company consented to outreach.",
    usageExplanation: "The completed score receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-nutrition": {
    slug: "mcp-nutrition",
    title: "Calculate a dilution from explicit units",
    request: "How much of a 100 mg in 2 mL stock gives a 50 mg amount?",
    calls: [{
      tool: "nutrition_dilution",
      arguments: {
        desired: 50,
        desired_unit: "mg",
        stock_amount: 100,
        stock_unit: "mg",
        stock_volume_ml: 2,
      },
    }],
    execution: "Validates the units and applies the deterministic dilution formula to the supplied values.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "nutrition.dilution.v1",
      desiredAmount: { value: 50, unit: "mg" },
      requiredStockVolumeMl: 1,
    },
    permission: "Requires an authenticated, entitled account. The calculation uses no patient record or external provider.",
    boundary: "This is a mathematical calculation, not medical advice or a recommendation to prepare or administer a substance.",
    usageExplanation: "The calculation receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-pty": {
    slug: "mcp-pty",
    title: "Open a bounded terminal session and capture its output",
    request: "Run one echo command in an isolated session.",
    calls: [{
      tool: "pty_open",
      arguments: { command: "/bin/echo", args: ["hosted PTY ready"] },
    }],
    execution: "Starts one isolated terminal session with the requested bounded command and returns a session handle for observable reads and closure.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "pty.open-session.v1",
      status: "open",
      command: "/bin/echo",
      output: "hosted PTY ready",
    },
    permission: "Requires an authenticated, entitled account. Runtime policy controls the executable, resource limits, and session lifetime.",
    boundary: "PTY access is not an unrestricted host shell. Sessions are isolated, time-bounded, and subject to command and resource policy.",
    usageExplanation: "Terminal work receives a measured duration receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-repo-fleet": {
    slug: "mcp-repo-fleet",
    title: "List the repositories in a governed fleet manifest",
    request: "Show the repositories this fleet configuration manages.",
    calls: [{ tool: "repo_fleet_list", arguments: {} }],
    execution: "Reads the configured fleet manifest and returns normalized repository identifiers and paths without syncing or mutating them.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "repo-fleet.catalog-list.v1",
      status: "ok",
      repositories: [{ id: "example-service", defaultBranch: "main" }],
      mutationPerformed: false,
    },
    permission: "Requires an authenticated, entitled account. This listing call uses the hosted read-only fleet profile.",
    boundary: "Clone, sync, and other mutating fleet operations have separate policy and approval requirements.",
    usageExplanation: "The listing receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-seo": {
    slug: "mcp-seo",
    title: "Run a deterministic SEO pipeline example",
    request: "Show the inspection and planning stages without crawling a customer site.",
    calls: [{ tool: "run_demo_pipeline_tool", arguments: {} }],
    execution: "Runs the built-in demonstration pipeline and returns route, inspection, and recommendation artifacts without live network collection.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "seo.demo-pipeline.v1",
      status: "complete",
      stages: ["route-discovery", "page-inspection", "internal-link-plan"],
      liveRequests: 0,
    },
    permission: "Requires an authenticated, entitled account. The demonstration call needs no site credential or external provider key.",
    boundary: "Live inspection is a separate operation and must respect the target site's access policy and request limits.",
    usageExplanation: "The pipeline call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
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
    usageExplanation: "Each call receives its own measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
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
    usageExplanation: "The completed call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
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
    usageExplanation: "The completed analysis receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
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
    usageExplanation: "The completed call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-repointel": {
    slug: "mcp-repointel",
    title: "Orient an agent before it changes retrieval code",
    request: "Give me the indexed map of ExplicitMem before I change retrieval.",
    calls: [
      {
        tool: "get_repository_summary",
        arguments: { repo: "explicitmem-mcp-ff694657" },
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
    permission: "Requires an authenticated, entitled account. This read-only workflow uses an approved pre-indexed public or demo repository.",
    boundary: "Hosted access is limited to pre-indexed public or demo repositories; private source is not currently supported.",
    usageExplanation: "The completed summary receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
};

for (const [slug, proof] of Object.entries(productWorkflowProofs)) {
  if (proof.slug !== slug) {
    throw new Error(`Workflow proof key ${slug} does not match payload slug ${proof.slug}`);
  }
  if (proof.calls.length === 0) {
    throw new Error(`Workflow proof ${slug} must include at least one tool call`);
  }
}

export function getProductWorkflowProof(slug: string): ProductWorkflowProof | null {
  return productWorkflowProofs[slug] ?? null;
}
