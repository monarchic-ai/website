# WebInfo planning artifacts

This directory contains portable outputs from the approved Monarchic corporate
website interview.

## Artifacts

- `monarchic-meta-website.portable.webinfo.json` is the complete semantic
  planning archive. It preserves discovery answers, identity, the approved
  planning brief and sitemap, page briefs, page maps, approval records, review
  events, and WebComposer handoff state.
- `monarchic-context-seed.webinfo.json` is the reusable company-context seed for
  another Monarchic website or web application. It preserves the company
  identity, audiences, differentiation, evidence policy, voice, and product
  boundaries while clearing the corporate site's interview session, planning
  brief, sitemap, page briefs, page maps, and approval history.

The portable archive intentionally clears `operationReceipts`. Those receipts
are idempotency and transport-cache records rather than interview semantics,
and retaining them made the export exceed WebInfo's import safety limit. Both
artifacts have been imported successfully into a clean WebInfo store.

## Reuse workflow

1. Import `monarchic-context-seed.webinfo.json` with
   `webinfo_import_project`, providing a new project name.
2. Start or resume the interview for the new application.
3. Supply its specific users, goals, workflows, destinations, purchasing
   boundaries, and product lifecycle.
4. Regenerate and approve its planning brief, sitemap, page briefs, and page
   maps rather than reusing the corporate site's downstream artifacts.

Run the repository checks with:

```bash
nix flake check
```

The Nix contracts check validates both portable artifacts as well as the
WebComposer route and page-map contracts.
