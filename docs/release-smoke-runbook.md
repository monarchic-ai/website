# Website Release Smoke Runbook

This runbook covers the public website live smoke gate.

## Current Evidence

Latest local run date: 2026-07-19 UTC.

Production website smoke is green on the `www` route. Staging DNS is now
configured and Vercel-verified:

- Website commit `53a41eff315199e0f938a4a63677bbe59b687d03`
  removes Verified Patch from the public catalog and replaces its homepage card
  with ReleaseOps. Local catalog, WebComposer, Astro, build, and desktop/mobile
  rendering checks passed. A Git-connected Vercel deployment briefly routed
  this commit to production after the main push. The release hold was restored
  immediately by rolling back to deployment
  `dpl_4zXsY8xfeKm6iwHh6xEmLVqJyYp7`, commit
  `579f15cfab08732ca922905b9ad61574ef24445f`. Vercel Git integration is disconnected,
  so later main pushes cannot create website deployments.

- `pnpm smoke:production` against `https://www.monarchic.io` passed on
  2026-07-02 UTC. The smoke verified DNS, `HEAD /`, `/build-info.json`,
  `/robots.txt`, `/sitemap.xml`, homepage metadata, product routes, and
  research routes. `/build-info.json` reports the deployed website commit from
  `monarchic-ai/website` and catalog artifact digest
  `sha256:f222975ba9e40824d8127d23e64df4dc56123229a81ac09952bdd2dfd5e8d878`.
- `pnpm smoke:staging` against `https://staging.monarchic.io` passed on
  2026-07-02 UTC after adding the Cloudflare `staging` CNAME and Vercel
  verification TXT record. The staging hostname currently serves the same
  production-canonical website deployment, so the smoke command expects
  canonical URLs under `https://monarchic.io`.

Keep this command as the current passing production release evidence gate while
the apex route is under investigation:

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
- BrowserOps product detail page
- research index
- RepoIntel research page
- app CTA targets
- horizontal overflow

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

Run the same gate from GitHub with
`.github/workflows/website-release-smoke.yml`.

Set `MONARCHIC_WEBSITE_SMOKE_REPORT=website-release-smoke-report.json` when
running in CI or when you need a persisted evidence file. The GitHub workflow
uploads this report on both pass and fail.

Network-level fetch failures are retried four times by default. Set
`MONARCHIC_WEBSITE_SMOKE_FETCH_ATTEMPTS=1` to disable retries when debugging a
single request, or raise it temporarily when a provider is known to be
intermittent. HTTP responses such as `404` and `500` are not retried.

## Staging Gate

When a staging website domain exists, run:

```bash
MONARCHIC_WEBSITE_SMOKE_URL=https://staging.monarchic.io \
MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://staging.monarchic.io \
MONARCHIC_WEBAPP_SMOKE_URL=https://staging-app.monarchic.io \
pnpm smoke:production
```

The staging hostname is served by the dedicated `website-staging` Vercel
project. Its production environment uses
`PUBLIC_MONARCHIC_WEBSITE_BASE_URL=https://staging.monarchic.io` and
`PUBLIC_MONARCHIC_API_BASE_URL=https://staging-api.monarchic.io`. The Vercel
project is not connected to Git, so staging promotion is an explicit local CLI
operation.

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
- the production deployment serves the current `main` commit
- `/build-info.json` reports the current commit and catalog digest
- `/robots.txt` and `/sitemap.xml` are served by the same deployment without
  connect timeouts
- `staging.monarchic.io` is either configured with DNS/domain routing or
  excluded from required staging smoke gates

The smoke script prints a JSON report on both pass and fail. Failed reports
include `status: "failed"`, the checks completed before the error, and a
redacted error message. Use that report as the release evidence artifact rather
than relying only on the stack trace.
