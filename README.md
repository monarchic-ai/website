# website

Public website for Monarchic AI.

## Current Scope

The site is currently a small Astro landing page for the Monarchic brand. The
checked-in implementation renders a "coming soon" page with:

- Astro as the site shell
- a React-based shader background component in `src/components/Shader14.tsx`
- Tailwind CSS v4 for styling
- Svelte integration available in the project, even though the current page is
  driven by Astro plus React

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
│   │   └── Shader14.tsx
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
- `astro.config.mjs` enables both React and Svelte integrations.
- `dist/` contains generated build output and should be treated as an artifact,
  not as source.
