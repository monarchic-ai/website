# website

Public website for Monarchic.

## Approved planning contracts

The approved WebInfo interview defines the next corporate-site information
architecture in [`webcomposer/site-map.contract.json`](webcomposer/site-map.contract.json)
and [`webcomposer/page-maps.json`](webcomposer/page-maps.json). Its routes are:

- `/`
- `/products`
- `/products/[slug]`
- `/research`
- `/research/[slug]`
- `/company`
- `/security`
- `/privacy`
- `/terms`

The contracts supersede older planning assumptions such as `/about`. The
substantive company page now lives at `/company`, with `/about` retained only as
a compatibility redirect. Newer product-catalog decisions still retain the
standalone `/waitlist` and substantive `/research/explicitmem` routes.

Portable interview artifacts and reuse instructions live in
[`webinfo/`](webinfo/README.md). Validate the handoff with:

```bash
pnpm check:webcomposer
pnpm check:webinfo-artifacts
```

## Current Scope

The site is an Astro static site for the Monarchic brand and public product
research surface. It currently owns:

- the brand home page at `/`
- the public products catalog at `/products`
- individual product detail pages at `/products/[slug]`
- the research index at `/research`
- one bounded research brief for each of the 27 public MCPs at
  `/research/[slug]`
- the substantive ExplicitMem benchmark at `/research/explicitmem`
- the current trust boundary at `/security`
- the company, mission, approach, and operator page at `/company`
- a compatibility redirect from `/about` to `/company`
- privacy and service terms at `/privacy` and `/terms`
- generated `robots.txt` and `sitemap.xml` endpoints

The authenticated product experience, cart, account pages, API-key management,
and hosted MCP dashboard live in `../monarchic-webapp`.

## Stack

- Astro as the site shell
- Tailwind CSS v4 for styling
- a self-hosted Space Grotesk variable font bundled through Fontsource
- Svelte integration available for future interactive islands
- A code-native shader background component in `src/components/Shader14.astro`
- Shared canonical/Open Graph/Twitter metadata through
  `src/components/SeoHead.astro`
- A 1200x630 branded social preview image at `public/social-card.png`

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm check`
- `pnpm check:webcomposer`
- `pnpm build`
- `pnpm preview`
- `pnpm smoke:local`
- `pnpm smoke:production`
- `pnpm smoke:production:www`
- `pnpm smoke:production:apex`
- `pnpm smoke:staging`
- `pnpm astro -- --help`

The project currently expects Node `>=22.12.0`.

On NixOS, run browser smoke inside the repository dev shell so Playwright uses
the packaged Chromium build:

```bash
nix develop -c pnpm smoke:production
```

GitHub Actions runs the shared Monarchic Nix CI workflow on `main`. That
workflow builds the flake packages, runs the flake checks, and leaves release
smoke commands as explicit flake apps.

Run production release smoke with:

```bash
nix run .#smoke-production
```

Run staging release smoke with:

```bash
nix run .#smoke-staging
```

Use [`docs/release-smoke-runbook.md`](docs/release-smoke-runbook.md) for the
live deployment checklist and current smoke evidence.

## Layout

```text
/
├── public/
│   ├── favicon.svg
│   ├── social-card.png
│   └── social-card.svg
├── src/
│   ├── components/
│   │   ├── ProductWorkflowProof.astro
│   │   ├── Shader14.astro
│   │   └── SeoHead.astro
│   ├── lib/
│   │   ├── mcpResearch.ts
│   │   ├── mcpResearchContent.json
│   │   ├── pricing.ts
│   │   ├── productDetails.ts
│   │   └── productWorkflowProofs.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro (compatibility redirect)
│   │   ├── company.astro
│   │   ├── privacy.astro
│   │   ├── robots.txt.ts
│   │   ├── security.astro
│   │   ├── sitemap.xml.ts
│   │   ├── terms.astro
│   │   ├── products/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── research/
│   │       ├── index.astro
│   │       ├── [slug].astro
│   │       └── explicitmem.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── svelte.config.js
└── package.json
```

## Notes

- `src/lib/pricing.generated.json`, `src/lib/pricing.coming-soon.json`, and
  `src/lib/productDetails.ts` are generated deploy artifacts copied from
  `../shared/product-catalog`. Edit the shared catalog, then run
  `pnpm sync:shared-catalog` from `../monarchic-webapp`.
- `pnpm check:shared-catalog` compares the website and webapp generated catalog
  artifacts against `../shared/product-catalog` when the sibling workspace is
  present. In a standalone website checkout it skips cleanly so Vercel and
  GitHub can still build the deployable artifact copy.
- `src/lib/usage-policy.generated.json` is the fail-closed public subset of
  `monarchic-mcp-catalog`. Run `pnpm sync:mcp-pricing` after catalog changes.
  The sync includes approved subscription prices, cadence, rollover, stop
  behavior, and aggregate class coverage while deliberately excluding
  provisional operation rates and unpublished allowance quantities.
- `pnpm check:mcp-pricing` validates the committed public subset and its plan
  prices. When the source catalog is available locally, it also fails on drift;
  standalone deploy checkouts validate the committed artifact without needing
  the sibling repository.
- `/build-info.json` exposes one sorted `catalog.planSlugs` inventory plus
  aggregate `catalog.manifestDigest` and `catalog.artifactDigest` values for
  generated artifacts. The live smoke verifies that shape and both digests
  without publishing internal file names or per-file hashes. The endpoint is
  marked `noindex, nofollow`.
- `vercel.json` defines the expected static deployment settings. Set
  `PUBLIC_MONARCHIC_WEBSITE_BASE_URL`, `PUBLIC_MONARCHIC_API_BASE_URL`, and
  `PUBLIC_MONARCHIC_WEBAPP_BASE_URL` from
  `env.example` in Vercel before deploying.
- `vercel.json` also applies the website CSP, HSTS, framing, MIME-sniffing,
  referrer, and browser-permission headers. Keep the CSP API origins aligned
  with the production and staging waitlist endpoints.
- Available MCP product pages render a website-local, schema-grounded workflow
  proof. Those examples must keep their permission and content-isolation
  boundaries beside the request, output, and estimated usage impact.
- `src/lib/mcpResearchContent.json` is website-local public content. Its entries
  must cover the same 27 MCP slugs as the catalog exactly. Hosted status and the
  available-plan or waitlist action are derived from the catalog instead of
  being duplicated in research copy.
- Product research briefs explain the problem, validation approach, public
  evidence boundary, and current limits without exposing proprietary
  implementation details. A brief is not called a benchmark unless it meets
  the stricter publication bar used by the ExplicitMem LongMemEval-S report.
- Set `PUBLIC_MONARCHIC_WEBSITE_BASE_URL` when building non-production
  environments that need canonical URLs, Open Graph URLs, robots output, and
  sitemap entries to point somewhere other than `https://monarchic.io`.
- Set `PUBLIC_MONARCHIC_API_BASE_URL` when the website waitlist should submit
  somewhere other than `https://api.monarchic.io`.
- Set `PUBLIC_MONARCHIC_WEBAPP_BASE_URL` when available-plan purchase links
  should open somewhere other than `https://app.monarchic.io`.
- `pnpm smoke:local` builds the static site, starts `astro preview` on
  `127.0.0.1:4332`, runs the production smoke assertions against that local
  preview, and stops the server. Override the port with
  `MONARCHIC_WEBSITE_LOCAL_PORT`.
- `pnpm smoke:production` uses Playwright to verify the live site HTTP
  response, `robots.txt`, `sitemap.xml`, homepage metadata, product pages,
  all 27 research routes, reciprocal product links, the waitlist form contract,
  and horizontal overflow against
  `https://www.monarchic.io` while keeping canonical URLs pinned to
  `https://monarchic.io`. Override the target with
  `MONARCHIC_WEBSITE_SMOKE_URL`. Override expected canonical links with
  `MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL`, which is useful when smoking a
  local preview built with production canonical URLs.
  On NixOS, prefer `nix develop -c pnpm smoke:production` so the smoke script
  gets a Chromium executable with the required shared libraries.
- `pnpm smoke:production:www` is an alias for the current production release
  gate.
- `pnpm smoke:production:apex` runs the same gate against
  `https://monarchic.io`. Use it while investigating apex DNS or edge routing.
- `dist/` contains generated build output and should be treated as an artifact,
  not as source.
