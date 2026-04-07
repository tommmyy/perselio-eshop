# Perselio Shop

Demo e-shop used for development and testing of Perselio widgets.

## Quick start

```sh
# 1. Download product & category data (required before first build)
yarn perselio-shop download-metadata

# 2. Start dev server (English, default)
yarn workspace @fast-ai/perselio-shop dev

# 3. Build for production
yarn workspace @fast-ai/perselio-shop build

# 4. Preview production build
yarn workspace @fast-ai/perselio-shop preview
```

## Localization

The locale is selected at **build time** via the `SHOP_LOCALE` env var. Default: `en`.

```sh
# Build in Czech
SHOP_LOCALE=cs yarn workspace @fast-ai/perselio-shop build

# Dev server in Czech
SHOP_LOCALE=cs yarn workspace @fast-ai/perselio-shop dev
```

### Available locales

| Code | Language |
| ---- | -------- |
| `en` | English  |
| `cs` | Czech    |

### Adding / updating translations

Message catalogs are plain JSON files in `src/i18n/`:

```
src/i18n/
├── en.json   # English (source of truth)
├── cs.json   # Czech
└── index.ts  # msg() helper, formatPrice(), locale constants
```

To **add a new locale**:

1. Copy `src/i18n/en.json` to `src/i18n/{code}.json` and translate all values.
2. Add `import xx from './{code}.json'` in `src/i18n/index.ts` and register it in the `catalogs` map.
3. If the locale uses a different number/currency format, update `formatPrice()` in `src/i18n/index.ts`.
4. Build with `SHOP_LOCALE={code}`.

To **update existing translations**, edit the corresponding JSON file directly. Keys use dot-separated namespaces (`cart.title`, `product.addToCart`, etc.) with `{param}` placeholders for interpolation.

## Scripts

### Download product & category metadata

Fetches a representative subset of real tenant data from Typesense and saves it as local JSON fixtures.

```sh
# From the repo root (uses yarn workspace alias)
yarn perselio-shop download-metadata

# With options
yarn perselio-shop download-metadata --count 300 --out-dir data
```

Or run directly:

```sh
node apps/perselio-shop/scripts/download-metadata.mjs --count 100
```

#### Options

| Flag                      | Env var                 | Default                        | Description                     |
| ------------------------- | ----------------------- | ------------------------------ | ------------------------------- |
| `--count <n>`             | `PRODUCT_COUNT`         | `200`                          | Number of products to download  |
| `--products-collection`   | `PRODUCTS_COLLECTION`   | `items-search__atx`            | Typesense products collection   |
| `--categories-collection` | `CATEGORIES_COLLECTION` | `items-search-categories__atx` | Typesense categories collection |
| `--out-dir <path>`        | —                       | `.` (current dir)              | Output directory                |

CLI flags take precedence over env vars.

#### Output

Two JSON files written to `--out-dir`:

- **products.json** — product documents sampled evenly across subcategories
- **categories.json** — all category documents from the categories collection

#### How sampling works

The script discovers the two-level category tree by faceting the products collection:

1. Facet `categories_by_level.lvl1` to get top-level categories (e.g. _Dámské_, _Pánské_, _Plavky_).
2. For each top-level, facet `categories_by_level.lvl2` to get subcategories (e.g. _Dámské > Spodní prádlo_, _Dámské > Noční prádlo_).
3. Distribute the requested `--count` evenly across all lvl2 buckets so the result covers the full breadth of the catalog.
4. If the quota is still not met after iterating all buckets, remaining products are fetched without any category filter.
