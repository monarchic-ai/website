# Website Release Smoke Runbook

This runbook covers the public website live smoke gate.

## Current Evidence

Latest staging validation: 2026-08-22 UTC.

- Website commit `8b551e5f175a2f3a1288f48a9be15d751fa36122` is deployed to the
  isolated `website-staging` project as
  `dpl_J6dZ164o7zvBDH1jh4e9gLyHXYmW`.
- Full browser smoke passed against `https://staging.monarchic.io` on
  2026-08-22 UTC. The checks covered security headers, DNS and HTTP responses,
  build info, metadata, 30 catalog plans, 18 hosted workflow proofs, the one
  approved research route, all four ExplicitMem study scopes, corporate legal
  boundaries, redirects, waitlist behavior, and 320px overflow.
- `/build-info.json` reports commit
  `8b551e5f175a2f3a1288f48a9be15d751fa36122` and catalog artifact digest
  `sha256:f717ad45996d8995884137bcd2eb8209c5d42fec67061f69705e9a9be2699ee1`.
- Production continues to serve commit
  `3b1c444bc07a9e9444e7f86d2bb2c3a2f71173a8` until the staging candidate is
  explicitly approved for production promotion.
- Vercel Git integration is disconnected. A push to `main` does not create
  a deployment. Production releases must use the clean, commit-pinned local CLI
  workflow documented under Deployment Checks.

Use this command as the production release evidence gate:

```bash
pnpm smoke:production
```

## Production Gate

The production smoke verifies:

- HTTP response for `/`
- `robots.txt`
- `sitemap.xml`
- `/build-info.json`
- homepage content and canonical/Open Graph/Twitter metadata
- public product index
- the single approved MCP product-to-research link and reciprocal backlink
- public catalog coverage, including 24 MCP products and 18 hosted workflow proofs
- research index coverage and the absence of placeholder or pre-launch studies
- the ExplicitMem report's distinct LongMemEval-S, LoCoMo, cross-dataset, and generic-answer scopes
- corporate website Privacy and Terms boundaries
- product-specific waitlist behavior and indexing policy
- app CTA targets
- desktop and 320px horizontal overflow

The public research inventory contains only approved, artifact-backed evidence.
Product workflow receipts remain engineering verification on product pages and
do not create a matching research route. Planned product pages retain their
lifecycle and operating boundary without publishing placeholder studies.

Run production locally:

```bash
pnpm smoke:production
```

On NixOS, use the repository dev shell so Playwright launches the packaged
Chromium build instead of the downloaded browser cache:

```bash
nix develop -c pnpm smoke:production
```

`pnpm smoke:production` targets the `www` production route while keeping
canonical expectations on the apex domain. `pnpm smoke:production:www` is kept
as a compatibility alias.

Run the apex production route for routing triage:

```bash
pnpm smoke:production:apex
```

Run the same gate through the flake app:

```bash
nix run .#smoke-production
```

Set `MONARCHIC_WEBSITE_SMOKE_REPORT=website-release-smoke-report.json` when
running in CI or when you need a persisted evidence file.

Network-level fetch failures are retried four times by default. Set
`MONARCHIC_WEBSITE_SMOKE_FETCH_ATTEMPTS=1` to disable retries when debugging a
single request, or raise it temporarily when a provider is known to be
intermittent. HTTP responses such as `404` and `500` are not retried.

## Staging Gate

When a staging website domain exists, run:

```bash
nix run .#smoke-staging
```

The staging hostname is served by the dedicated `website-staging` Vercel
project. Its production environment uses
`PUBLIC_MONARCHIC_WEBSITE_BASE_URL=https://staging.monarchic.io` and
`PUBLIC_MONARCHIC_API_BASE_URL=https://staging-api.monarchic.io`. The Vercel
project is not connected to Git, so staging promotion is an explicit local CLI
operation. Because Vercel domain ownership is held in an older account context,
a Cloudflare Worker route proxies only `staging.monarchic.io/*` to the stable
`website-staging-lac.vercel.app` project alias. The proxy adds an
`X-Robots-Tag: noindex, nofollow` response header.

## Development Gate

The remote development website uses the dedicated `website-dev` Vercel project
at `https://website-dev-monarchic.vercel.app`. It builds with
`PUBLIC_MONARCHIC_API_BASE_URL=https://dev-api.monarchic.io` and remains
`noindex, nofollow`. Until a dedicated development webapp is established, its
Apps links deliberately target the non-production staging webapp instead of
production.

Run its live smoke through the repository shell:

```bash
nix run .#smoke-development
```

Deploy a clean, pinned commit with:

```bash
MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
pnpm deploy:vercel:development

MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
pnpm deploy:vercel:development -- --apply
```

`dev.monarchic.io` is reserved as the eventual public development alias. It
requires an authenticated Cloudflare change before it can replace the Vercel
project URL.

## Deployment Checks

Production website deployment uses the authenticated local Vercel CLI. The
default command is read-only:

```bash
pnpm vercel:whoami
pnpm vercel:inspect:production
pnpm deploy:vercel:local
```

Review and deploy a clean, pinned commit to the dedicated staging project:

```bash
MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
pnpm deploy:vercel:staging

MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
pnpm deploy:vercel:staging -- --apply
```

Staging deployment does not require the production approval variable. It cannot
target the production project because the project ID is selected from the
`MONARCHIC_VERCEL_PROJECT=staging` contract.

The staging hostname proxy has its own dry-run and apply gate:

```bash
pnpm deploy:cloudflare:staging-proxy

MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
MONARCHIC_WEBSITE_STAGING_PROXY_APPROVED=true \
pnpm deploy:cloudflare:staging-proxy -- --apply
```

After pricing and production deployment approval, deploy from a clean checkout
of the pinned candidate:

```bash
MONARCHIC_WEBSITE_EXPECTED_COMMIT_SHA="$(git rev-parse HEAD)" \
MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED=true \
pnpm deploy:vercel:local -- --apply
```

The command sets commit metadata for `/build-info.json`, builds locally, and
deploys prebuilt output through the operator's Vercel session. It requires no
`VERCEL_TOKEN`. Reconnect Vercel Git only if automatic production deployment is
explicitly approved later.

If smoke fails before browser assertions:

1. Confirm DNS for `monarchic.io` resolves from outside the deployment network.
2. Confirm the resolved A record points at the intended Vercel project or
   deployment target.
3. Confirm `staging.monarchic.io` exists before enabling staging as a required
   launch gate.
4. Confirm Vercel has a successful deployment for the approved candidate
   commit.
5. Confirm the deployment serves `/robots.txt`, `/sitemap.xml`, and
   `/build-info.json`.
6. Confirm Vercel environment variables match `env.example`.
7. Rerun `pnpm smoke:production:apex`.

Launch evidence should include the target URL, commit SHA, smoke command,
timestamp, and the JSON check list printed by the smoke script.

## Vercel MCP Checks

Use Vercel MCP for production/staging website blockers that need deployment or
domain inspection.

Codex setup:

```bash
codex mcp add vercel --url https://mcp.vercel.com
codex mcp login vercel
cd ../monarchic-webapp
pnpm check:vercel-mcp
```

Expected status after login:

```text
vercel  https://mcp.vercel.com  enabled  OAuth
```

`pnpm check:vercel-mcp` is an operator-local check. It is intentionally not
part of CI because it verifies the signed-in Codex user's OAuth state.

For the current website smoke blockers, use Vercel MCP to confirm:

- `monarchic.io` is routed to the `monarchic-ai/website` project
- the production deployment serves the explicitly approved commit
- `/build-info.json` reports the current commit, a sorted `catalog.planSlugs`
  inventory, and the catalog digest, and returns
  `X-Robots-Tag: noindex, nofollow`
- `/robots.txt` and `/sitemap.xml` are served by the same deployment without
  connect timeouts
- `staging.monarchic.io` routes through `monarchic-website-staging-proxy` to
  the dedicated `website-staging` Vercel project

The smoke script prints a JSON report on both pass and fail. Failed reports
include `status: "failed"`, the checks completed before the error, and a
redacted error message. Use that report as the release evidence artifact rather
than relying only on the stack trace.
