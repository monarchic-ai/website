# website

Public company website for Monarchic LLC.

## Current Scope

The site is an Astro static site for the Monarchic brand and public product
research surface. It currently owns:

- the brand home page at `/`
- the public products catalog at `/products`
- individual product detail pages at `/products/[slug]`
- the research index at `/research`
- research pages for BrowserOps, ExplicitMem, and RepoIntel
- generated `robots.txt` and `sitemap.xml` endpoints

The authenticated product experience, cart, account pages, API-key management,
and hosted MCP dashboard live in `../monarchic-webapp`.

## Stack

- Astro as the site shell
- Tailwind CSS v4 for styling
- Svelte integration available for future interactive islands
- A code-native shader background component in `src/components/Shader14.astro`
- Shared canonical/Open Graph/Twitter metadata through
  `src/components/SeoHead.astro`
- A 1200x630 branded social preview image at `public/social-card.png`

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm check`
- `pnpm build`
- `pnpm preview`
- `pnpm smoke:local`
- `pnpm smoke:production`
- `pnpm smoke:production:www`
- `pnpm smoke:production:apex`
- `pnpm smoke:staging`
- `pnpm astro -- --help`

The project currently expects Node `>=22.12.0`.

GitHub Actions runs `.github/workflows/website-readiness.yml` on website
changes. That workflow installs dependencies, runs Astro diagnostics, and
builds the static site. Its manual smoke job installs Playwright Chromium and
runs `pnpm smoke:local`.

The manual release workflow at `.github/workflows/website-release-smoke.yml`
runs `pnpm smoke:production` against the configured production or staging
target.
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
│   │   ├── Shader14.astro
│   │   └── SeoHead.astro
│   ├── lib/
│   │   ├── pricing.ts
│   │   └── productDetails.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── robots.txt.ts
│   │   ├── sitemap.xml.ts
│   │   ├── products/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── research/
│   │       ├── index.astro
│   │       ├── browserops.astro
│   │       ├── explicitmem.astro
│   │       └── repointel.astro
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
- `/build-info.json` exposes a `catalog.artifactDigest` and
  `catalog.artifactFileHashes` for those generated artifacts. The live smoke
  requires this provenance so deployment evidence can tie the public site back
  to the exact catalog artifact set.
- `vercel.json` defines the expected static deployment settings. Set
  `PUBLIC_MONARCHIC_WEBSITE_BASE_URL` and `PUBLIC_MONARCHIC_API_BASE_URL` from
  `env.example` in Vercel before deploying.
- Set `PUBLIC_MONARCHIC_WEBSITE_BASE_URL` when building non-production
  environments that need canonical URLs, Open Graph URLs, robots output, and
  sitemap entries to point somewhere other than `https://monarchic.io`.
- Set `PUBLIC_MONARCHIC_API_BASE_URL` when the website waitlist should submit
  somewhere other than `https://api.monarchic.io`.
- `pnpm smoke:local` builds the static site, starts `astro preview` on
  `127.0.0.1:4332`, runs the production smoke assertions against that local
  preview, and stops the server. Override the port with
  `MONARCHIC_WEBSITE_LOCAL_PORT`.
- `pnpm smoke:production` uses Playwright to verify the live site HTTP
  response, `robots.txt`, `sitemap.xml`, homepage metadata, product pages,
  the waitlist form contract, research pages, and horizontal overflow against
  `https://www.monarchic.io` while keeping canonical URLs pinned to
  `https://monarchic.io`. Override the target with
  `MONARCHIC_WEBSITE_SMOKE_URL`. Override expected canonical links with
  `MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL`, which is useful when smoking a
  local preview built with production canonical URLs.
- `pnpm smoke:production:www` is an alias for the current production release
  gate.
- `pnpm smoke:production:apex` runs the same gate against
  `https://monarchic.io`. Use it while investigating apex DNS or edge routing.
- `dist/` contains generated build output and should be treated as an artifact,
  not as source.
