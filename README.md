# Monarchic Website

Buyer-facing narrative and marketing surface for Monarchic AI.

This repository owns the public website experience. It complements the
commercial control-plane work in `monarchic-webapp` and stays aligned with the
organization-level routing and milestone sequencing in `meta`.

## Ownership

- `website` owns the buyer-facing narrative surface.
- `monarchic-webapp` owns the buyer-facing cloud and commercial control-plane
  surfaces once runtime contracts are stable.
- `meta` owns the roadmap and platform blueprint that define how these client
  surfaces are sequenced and where new work should land.

## Commands

Run commands from the repository root:

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm preview`

## Interface Discovery

The hand-owned repo interface manifest lives at `docs/platform-interfaces.json`.
RepoIntel-generated wiki pages under `docs/wiki/` summarize the current indexed
shape of the site, but the interface manifest is the stable source for
cross-repo planning metadata.
