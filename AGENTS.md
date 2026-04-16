# Agent Guidelines for apps/perselio-shop

Astro 5 + React 19 + Tailwind 4 demo e-shop. Static output. Used for dev/testing of Perselio widgets.

## Critical Rules

1. **ALWAYS verify changes with Playwright MCP** — after implementing any feature or fix, test it in the browser.
2. **NEVER download data** — if `data/products.json` or `data/categories.json` are missing, ask the user to run `yarn perselio-shop download-metadata`.
3. **NEVER set `.env` vars** — if `TYPESENSE_API_KEY` or other env vars are missing, ask the user to provide them.
4. **Delegate environment setup to user** — do not attempt to fix missing data or credentials yourself.

## Dev Server

```sh
# Start dev server (default locale: en, port: 4321)
yarn workspace @fast-ai/perselio-shop start

# Czech locale
SHOP_LOCALE=cs yarn workspace @fast-ai/perselio-shop start
```

Dev server URL: `http://localhost:4321`

**Prerequisites:**

- Product/category data must exist in `data/` directory (user runs `yarn perselio-shop download-metadata` once)
- If data is missing, the dev server will crash — ask the user to download it

## Project Structure

```
apps/perselio-shop/
├── data/                    # Product/category JSON (gitignored, user downloads)
│   ├── products.json
│   └── categories.json
├── src/
│   ├── components/          # React components (*.tsx)
│   │   ├── Navbar.tsx
│   │   ├── SearchAutocomplete.tsx  # Example: autocomplete dropdown
│   │   └── ProductCard.tsx
│   ├── pages/               # Astro pages (routing)
│   │   ├── index.astro
│   │   ├── cart.astro
│   │   └── product/
│   ├── layouts/
│   │   └── Layout.astro     # Main layout (includes Navbar, Footer)
│   ├── lib/
│   │   ├── data.ts          # Server-side data loading (getProducts, getCategories)
│   │   └── utils.ts         # Shared utilities (slugify, formatPrice)
│   ├── i18n/                # Internationalization
│   │   ├── index.ts
│   │   ├── en.json
│   │   └── cs.json
│   └── styles/
│       └── global.css       # Tailwind 4 config + global styles
└── scripts/
    └── download-metadata.mjs  # Downloads data from Typesense (user runs manually)
```

## Key Pages

| Route              | File                     |
| ------------------ | ------------------------ |
| `/`                | `src/pages/index.astro`  |
| `/product/{slug}`  | `src/pages/product/`     |
| `/category/{slug}` | `src/pages/category/`    |
| `/cart`            | `src/pages/cart.astro`   |
| `/checkout`        | `src/pages/checkout/`    |
| `/search`          | `src/pages/search.astro` |

## Conventions

### Component Development

1. **React components** → `src/components/*.tsx`
   - Use TypeScript via `.tsx` extension
   - Export interfaces for props
   - Use Tailwind classes for styling (follow existing patterns)

2. **Data flow:**
   - Server-side data loading: `src/lib/data.ts` (getProducts, getCategories)
   - Pass data from `Layout.astro` → components via props
   - Example: `Layout.astro` loads products and passes lightweight subset to `Navbar` for autocomplete

3. **Styling:**
   - Use existing Tailwind custom properties (`var(--color-primary)`, `var(--radius-card)`)
   - Follow existing patterns (see `Navbar.tsx`, `ProductCard.tsx`)
   - Don't add external CSS dependencies

4. **Accessibility:**
   - Use semantic HTML and ARIA attributes
   - Example: autocomplete uses `role="combobox"`, `role="listbox"`, `aria-expanded`, `aria-activedescendant`
   - Test keyboard navigation (Arrow keys, Enter, Escape)

### i18n

Add keys to both `src/i18n/en.json` and `src/i18n/cs.json`:

```json
// en.json
{
  "autocomplete.suggestions": "Suggestions",
  "autocomplete.products": "Products"
}

// cs.json
{
  "autocomplete.suggestions": "Návrhy",
  "autocomplete.products": "Produkty"
}
```

Use in components: `msg('autocomplete.suggestions')`

## Data Attributes

**Always include tracking/test attributes on interactive elements:**

- `data-product-id="{id}"` on product cards and product links in autocomplete
- `data-variant-id="{id}"` on variant selectors
- Follow existing patterns in `ProductCard.tsx`

Example:

```tsx
<a href={href} data-product-id={product.id} className="...">
	{product.name}
</a>
```

## Env Vars

Prefix all client-visible env vars with `SHOP_` (configured in `astro.config.mjs` via `vite.envPrefix`).

| Var           | Default | Description       |
| ------------- | ------- | ----------------- |
| `SHOP_LOCALE` | `en`    | Build-time locale |

**Build-time only:** Not available in `download-metadata.mjs` (server-side script).

## Troubleshooting

### Dev server won't start

**Error: "Cannot find module './data/products.json'"**

→ Data not downloaded. Ask user: "Please run `yarn perselio-shop download-metadata` to download product data."

**Error: "TYPESENSE_API_KEY env var is required"**

→ Env vars not set. Ask user: "Please set `TYPESENSE_API_KEY` and collection env vars in `.env` file."

**Error: "Port 4321 already in use"**

→ Server already running. Ask user: "Dev server may already be running. Check `http://localhost:4321` or kill existing process."

### TypeScript errors

Run type check:

```bash
npx tsc --noEmit --project tsconfig.json
```

Common issues:

- Missing prop type definitions
- Incorrect import paths
- Missing null checks

### Missing images/404s in browser

Product images from downloaded data may point to external URLs. This is expected. Only verify that:

- Placeholder fallback UI renders correctly
- Image URLs are passed through props correctly

## Verifying with Playwright MCP

**CRITICAL: Always verify your changes in the browser after implementation.**

### Starting the Dev Server

Start in background if not already running:

```bash
yarn workspace @fast-ai/perselio-shop start > /tmp/perselio-shop-dev.log 2>&1 & echo $!
# Wait a few seconds for server to start
sleep 5 && curl -s http://localhost:4321 > /dev/null && echo "Dev server is up"
```

If server fails to start, check for:

- Missing data files (`data/products.json`, `data/categories.json`) → ask user to run `yarn perselio-shop download-metadata`
- Port 4321 already in use → ask user to stop existing process

### Verification Workflow

**After implementing any feature:**

1. **Navigate to the page:**

   ```
   browser_navigate → http://localhost:4321
   ```

2. **Take initial snapshot to understand structure:**

   ```
   browser_snapshot
   ```

3. **Interact with your feature:**
   - Click elements: `browser_click`
   - Type text: `browser_type`
   - Press keys: `browser_press_key` (e.g., ArrowDown, Enter, Escape)

4. **Verify expected behavior:**
   - Check page state: `browser_snapshot`
   - Take screenshots: `browser_take_screenshot`
   - Inspect DOM/attributes: `browser_evaluate`

5. **Test edge cases:**
   - Empty states
   - Keyboard navigation
   - Mobile viewport (if responsive)

### Example: Verifying Autocomplete

```
1. browser_navigate → http://localhost:4321
2. browser_click → search input (ref from snapshot)
3. browser_snapshot → verify dropdown appeared
4. browser_type → "shirt"
5. browser_snapshot → verify filtered results appear
6. browser_evaluate → check data-product-id attribute exists
7. browser_press_key → "ArrowDown"
8. browser_evaluate → verify aria-activedescendant is set
9. browser_press_key → "Enter"
10. browser_snapshot → verify navigation to product detail page
```

### Common Playwright Patterns

**Check console errors:**

```
browser_console_messages → level: "error"
```

**Verify attributes:**

```js
browser_evaluate → () => {
  const el = document.querySelector('[data-product-id]');
  return el?.getAttribute('data-product-id');
}
```

**Check element state:**

```js
browser_evaluate → () => {
  const input = document.querySelector('[role="combobox"]');
  return {
    expanded: input?.getAttribute('aria-expanded'),
    activeDescendant: input?.getAttribute('aria-activedescendant')
  };
}
```

### Cleanup

Stop dev server after verification:

```bash
kill <PID> 2>/dev/null || true
```

Close browser:

```
browser_close
```
