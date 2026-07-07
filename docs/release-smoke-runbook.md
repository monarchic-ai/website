# Website Release Smoke Runbook

This runbook covers the public website live smoke gate.

## Current Evidence

Latest local run date: 2026-07-02 UTC.

Production website smoke is green on the `www` route. Staging DNS is now
configured and Vercel-verified:

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
MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://monarchic.io \
MONARCHIC_WEBAPP_SMOKE_URL=https://staging-app.monarchic.io \
pnpm smoke:production
```

The current staging hostname intentionally validates a production-canonical
website deployment. If staging gets its own Vercel project or environment with
`PUBLIC_MONARCHIC_WEBSITE_BASE_URL=https://staging.monarchic.io`, update
`MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL` accordingly.

## Deployment Checks

If smoke fails before browser assertions:

1. Confirm DNS for `monarchic.io` resolves from outside the deployment network.
2. Confirm the resolved A record points at the intended Vercel project or
   deployment target.
3. Confirm `staging.monarchic.io` exists before enabling staging as a required
   launch gate.
4. Confirm Vercel has a successful deployment for the current `main` commit.
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
