# Icon BasePath Fix — Design

## Goal

Fix item icons 404ing on the deployed GitHub Pages site (served under
`/D2R-Records/`), while keeping local dev (served at `/`) working exactly as before.

## Background

`next.config.ts` already computes a `basePath` for GitHub Pages builds:

```ts
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}` : '';
```

This correctly prefixes Next's own routing/asset pipeline (pages, `_next/` chunks),
but every icon `<img>` in this codebase hardcodes a root-relative `src` string
directly (e.g. `` src={`/items/inv/${invFile}.png`} ``) — `next/image` would pick up
`basePath` automatically, but these are plain `<img>` tags (chosen originally for the
graceful-fallback-on-404 pattern, which `next/image` doesn't support as cleanly).
Confirmed via `curl`: `https://alice062w.github.io/items/inv/invhax.png` → 404;
`https://alice062w.github.io/D2R-Records/items/inv/invhax.png` → 200. Found 10
component files (excluding tests) with this pattern: 9 using `/items/inv/${invFile}`
and `AppraiserForm.tsx` using a second, separate `/items/${code}.png` path (the
appraiser's live item-preview icon).

## Design

- Add `NEXT_PUBLIC_BASE_PATH: basePath` to `next.config.ts`'s `env` block, reusing
  the same already-computed `basePath` value — Next.js inlines `NEXT_PUBLIC_*` env
  vars into the client bundle at build time, so this is available in both server and
  client components without any new build step.
- Add a tiny shared helper, `src/lib/basePath.ts`:
  ```ts
  export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  ```
- Update every icon `<img src="/items/...">` across the 10 affected files to
  `` src={`${BASE_PATH}/items/inv/${invFile}.png`} `` (or the equivalent for
  `AppraiserForm.tsx`'s `/items/${code}.png` path), importing `BASE_PATH` from the
  new helper.
- Locally and in any non-GitHub-Actions build, `BASE_PATH` is `''`, so the rendered
  `src` string is byte-for-byte identical to today — no behavior change outside the
  GitHub Pages deployment.

## Non-goals

- Switching to `next/image` — out of scope; this keeps the existing graceful-
  fallback `<img>` pattern exactly as-is, just fixing the path prefix.
- Any change to favicon or other Next-file-convention assets — those already go
  through Next's own basePath-aware pipeline.

## Testing plan

- Existing icon component tests assert `src` strings like `.toContain('/items/inv/invhax.png')`
  — these keep passing unchanged, since `BASE_PATH` is `''` in the test environment
  (no `GITHUB_ACTIONS`/`NEXT_PUBLIC_BASE_PATH` set), producing the same output.
- Manual: after building with `GITHUB_ACTIONS=true GITHUB_REPOSITORY=Alice062W/D2R-Records`
  (matching the real Actions env), confirm the exported HTML's icon `src` attributes
  are correctly prefixed with `/D2R-Records`.
