# Website Release Smoke Runbook

This runbook covers the public website live smoke gate.

## Current Evidence

Latest local run date: 2026-06-19 UTC.

Production and staging smoke are not green yet:

- `pnpm smoke:production` against `https://monarchic.io` reaches the domain
  and the homepage `HEAD /` returns `200`, but `robots.txt` times out. Current
  diagnostic: `A=216.198.79.1`, `AAAA=ENODATA`, request failure
  `UND_ERR_CONNECT_TIMEOUT`.
- The staging variant against `https://staging.monarchic.io` has no DNS target:
  `A=ENODATA`, `AAAA=ENODATA`. The smoke script fails immediately when both
  record families are missing.

Do not treat website production as launch-ready until this command passes:

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

Run the same gate from GitHub with
`.github/workflows/website-release-smoke.yml`.

Set `MONARCHIC_WEBSITE_SMOKE_REPORT=website-release-smoke-report.json` when
running in CI or when you need a persisted evidence file. The GitHub workflow
uploads this report on both pass and fail.

## Staging Gate

When a staging website domain exists, run:

```bash
MONARCHIC_WEBSITE_SMOKE_URL=https://staging.monarchic.io \
MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://staging.monarchic.io \
MONARCHIC_WEBAPP_SMOKE_URL=https://staging-app.monarchic.io \
pnpm smoke:production
```

Use `MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://monarchic.io` only when
intentionally validating a preview deployment built with production canonical
URLs.

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
7. Rerun `pnpm smoke:production`.

Launch evidence should include the target URL, commit SHA, smoke command,
timestamp, and the JSON check list printed by the smoke script.

The smoke script prints a JSON report on both pass and fail. Failed reports
include `status: "failed"`, the checks completed before the error, and a
redacted error message. Use that report as the release evidence artifact rather
than relying only on the stack trace.
