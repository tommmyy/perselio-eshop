# Agent Guidelines for apps/perselio-shop

Astro 5 + React 19 + Tailwind 4 demo e-shop. Static output (`output: 'static'`). Used for dev/testing of Perselio widgets.

## Critical Rules

1. **NEVER download data** — if `data/products.json`, `data/categories.json`, or `data/search-suggestions.json` are missing, ask the user to run `yarn perselio-shop download-metadata`. All three are required; missing any one crashes the dev server.
2. **NEVER set `.env` vars** — ask the user to provide `TYPESENSE_API_KEY` and collection env vars.
3. **Verify changes with Playwright MCP** after implementing features. Start dev server in background, navigate to `http://localhost:4321`, and use `browser_snapshot` / `browser_evaluate` to verify.

## Commands

```sh
# Dev server (port 4321, default locale: en)
yarn workspace @fast-ai/perselio-shop start

# Czech locale
SHOP_LOCALE=cs yarn workspace @fast-ai/perselio-shop start

# Build (auto-runs download-metadata first)
yarn workspace @fast-ai/perselio-shop build

# Type check
npx tsc --noEmit --project tsconfig.json
```

No tests exist in this project. No linter config. Verify via dev server + Playwright.

## Architecture

- **Data** — `data/` dir (gitignored). Three JSON files loaded at build time by `src/lib/data.ts` via `readFileSync`. Memoized; no runtime fetching.
- **Layout** — Single layout `src/layouts/Layout.astro`. Loads all data, passes subsets to components. Embeds GTM, GA4 (`G-PX5BD6E4L2`), Perselio script, and Google Consent Mode v2 (deny-by-default).
- **Components** — React `.tsx` in `src/components/`. Mounted via `client:load` in Astro pages.
- **Pages** — `src/pages/` with Astro file-based routing. Dynamic: `[slugId].astro` (product), `[slug].astro` (category).
- **i18n** — Build-time only. `SHOP_LOCALE` env var (default `en`). Catalogs: `src/i18n/{en,cs}.json`. Use `msg('key.name')` with `{param}` interpolation. Always update both locale files.
- **Schemas** — `src/schema.mjs` has Zod schemas for product/category data shapes.
- **Cart** — Client-side state in `src/lib/cart.tsx` (React context + localStorage).

## Conventions

- **Env vars**: Prefix client-visible vars with `SHOP_` (configured in `astro.config.mjs` via `vite.envPrefix`).
- **Styling**: Use existing Tailwind custom properties (`var(--color-primary)`, `var(--radius-card)`, etc.) defined in `src/styles/global.css`. No external CSS deps.
- **Data attributes**: Always add `data-product-id="{id}"` on product-interactive elements, `data-variant-id="{id}"` on variant selectors.
- **Path alias**: `@/*` maps to `./src/*` (tsconfig), but is not currently used in the codebase. Prefer relative imports for consistency.
- **Consent**: Cookie consent banner (`CookieConsent.tsx`) integrates with Google Consent Mode v2. The consent default script in `Layout.astro` must remain **before** GTM/GA4 scripts.

## Dev Server Startup (Background)

```sh
yarn workspace @fast-ai/perselio-shop start > /tmp/perselio-shop-dev.log 2>&1 & echo $!
sleep 5 && curl -s http://localhost:4321 > /dev/null && echo "Dev server is up"
```

Kill after verification: `kill <PID> 2>/dev/null || true`
