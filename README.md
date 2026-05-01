# website

Public website for Monarchic AI.

## Current Scope

The site is currently a small Astro account/access surface for the Monarchic
brand. The checked-in implementation renders a hosted access console with:

- Astro as the site shell
- a WebGL shader background component in `src/components/Shader14.astro`
- Tailwind CSS v4 for styling
- Svelte integration available in the project, even though the current page is
  driven by Astro
- sign-in/create-account links configured by public environment variables
- bearer-token display/copy support when a hosted auth callback supplies a token
- MCP config copy support for hosted API access

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm astro -- --help`

The project currently expects Node `>=22.12.0`.

## Layout

```text
/
├── public/
├── src/
│   ├── components/
│   │   └── Shader14.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── svelte.config.js
└── package.json
```

## Notes

- `src/pages/index.astro` is the current entry page.
- `astro.config.mjs` enables Svelte integration.
- `dist/` contains generated build output and should be treated as an artifact,
  not as source.

## Public Environment

- `PUBLIC_MONARCHIC_AUTH_LOGIN_URL`: hosted OAuth/OIDC login URL.
- `PUBLIC_MONARCHIC_AUTH_SIGNUP_URL`: hosted OAuth/OIDC signup URL.
- `PUBLIC_MONARCHIC_API_BASE_URL`: hosted API endpoint used in generated MCP
  config snippets.
- `PUBLIC_MONARCHIC_MCP_SERVER_NAME`: MCP server name used in generated config.
