#!/usr/bin/env node
/* eslint-disable no-console,import/no-extraneous-dependencies,no-await-in-loop */
/**
 * Download mock product & category data from Typesense for the demo e-shop.
 *
 * Usage:
 *   node scripts/download-metadata.mjs [--count 200] [--products-collection items-search__atx] [--categories-collection items-search-categories__atx] [--out-dir .]
 *
 * Env vars (override defaults, CLI flags take precedence):
 *   PRODUCT_COUNT              — total products to download (default: 200)
 *   PRODUCTS_COLLECTION        — Typesense collection for products
 *   CATEGORIES_COLLECTION      — Typesense collection for categories
 *   TYPESENSE_API_KEY          — Typesense API key (default: fSm4DJQRapagH6p4xPgDCTWX)
 */

import 'dotenv/config';
import { Client } from 'typesense';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { productSchema, categorySchema } from '../src/schema.mjs';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
	options: {
		count: { type: 'string', default: process.env.PRODUCT_COUNT ?? '200' },
		'products-collection': {
			type: 'string',
			default: process.env.PRODUCTS_COLLECTION,
		},
		'categories-collection': {
			type: 'string',
			default: process.env.CATEGORIES_COLLECTION,
		},
		'out-dir': { type: 'string', default: './data' },
		help: { type: 'boolean', default: false },
	},
	strict: true,
});

if (flags.help) {
	console.log(`
Usage: node scripts/download-metadata.mjs [options]

Options:
  --count <n>                     Number of products to download (default: 200)
  --products-collection <name>    Typesense products collection (default: items-search__atx)
  --categories-collection <name>  Typesense categories collection (default: items-search-categories__atx)
  --out-dir <path>                Output directory (default: .)
  --help                          Show this help
`);
	process.exit(0);
}

const errors = [];

if (!flags['products-collection']) {
	errors.push(
		'--products-collection (or PRODUCTS_COLLECTION env var) is required'
	);
}
if (!flags['categories-collection']) {
	errors.push(
		'--categories-collection (or CATEGORIES_COLLECTION env var) is required'
	);
}
if (!process.env.TYPESENSE_API_KEY) {
	errors.push('TYPESENSE_API_KEY env var is required');
}
if (Number.isNaN(Number(flags.count)) || Number(flags.count) <= 0) {
	errors.push(`--count must be a positive number, got "${flags.count}"`);
}

if (errors.length > 0) {
	console.error(`Error:\n  ${ errors.join('\n  ')}`);
	console.error('\nRun with --help for usage information.');
	process.exit(1);
}

const TOTAL_PRODUCTS = Number(flags.count);
const PRODUCTS_COLLECTION = flags['products-collection'];
const CATEGORIES_COLLECTION = flags['categories-collection'];
const OUT_DIR = resolve(flags['out-dir']);

// ---------------------------------------------------------------------------
// Derive include_fields from Zod schemas
// ---------------------------------------------------------------------------

/**
 * Extract top-level field names from a Zod object schema.
 * Works with z.object({...}) — reads the `.shape` property.
 */
function zodFieldNames(zodObject) {
	return Object.keys(zodObject.shape);
}

const PRODUCT_INCLUDE_FIELDS = zodFieldNames(productSchema).join(',');
const CATEGORY_INCLUDE_FIELDS = zodFieldNames(categorySchema).join(',');

// ---------------------------------------------------------------------------
// Typesense client
// ---------------------------------------------------------------------------

const client = new Client({
	nodes: [
		{
			host: 'api.zoe-ai.eu',
			path: '/api/v3/deep-search',
			port: 443,
			protocol: 'https',
		},
	],
	apiKey: process.env.TYPESENSE_API_KEY,
	connectionTimeoutSeconds: 4,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const search = (collection, params) =>
	client.collections(collection).documents().search(params);

/**
 * Fetch all categories from the categories collection.
 * Returns the raw document array.
 */
async function fetchCategories() {
	const PAGE_SIZE = 250;
	let page = 1;
	const allDocs = [];

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const result = await search(CATEGORIES_COLLECTION, {
			q: '*',
			per_page: PAGE_SIZE,
			page,
			include_fields: CATEGORY_INCLUDE_FIELDS,
		});

		const hits = hitsOf(result);
		allDocs.push(...hits.map(h => h.document));

		if (allDocs.length >= result.found || hits.length === 0) {
			break;
		}
		page++;
	}

	console.log(`Fetched ${allDocs.length} categories.`);
	return allDocs;
}

/**
 * Safely extract hits from a Typesense search result.
 * The proxy may return `{ code, error }` instead of `{ hits, found }`.
 */
function hitsOf(result) {
	if (result.error) {
		throw new Error(result.error);
	}
	return result.hits ?? [];
}

/**
 * Facet a field within an optional filter scope.
 * @returns {{ value: string; count: number }[]} sorted by count desc
 */
async function facetValues(field, filterBy) {
	const params = {
		q: '*',
		per_page: 0,
		page: 1,
		facet_by: field,
		max_facet_values: 50,
	};
	if (filterBy) {
		params.filter_by = filterBy;
	}

	const result = await search(PRODUCTS_COLLECTION, params);
	const facet = result.facet_counts?.find(f => f.field_name === field);
	if (!facet) {
		return [];
	}

	return facet.counts
		.map(c => ({ value: c.value, count: c.count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Build a two-level category tree via faceting.
 *
 * 1. Facet `categories_by_level.lvl1` → top-level categories.
 * 2. For each top-level, facet `categories_by_level.lvl2` → subcategories.
 *
 * Returns flat array of `{ lvl1, lvl2, count }` representing every
 * lvl2 bucket, sorted by lvl1 then by count desc within each lvl1.
 */
async function discoverCategoryBuckets() {
	const lvl1List = await facetValues('categories_by_level.lvl1');
	if (lvl1List.length === 0) {
		return [];
	}

	/** @type {{ lvl1: string; lvl2: string; count: number }[]} */
	const buckets = [];

	for (const { value: lvl1 } of lvl1List) {
		const subs = await facetValues(
			'categories_by_level.lvl2',
			`categories_by_level.lvl1:=${lvl1}`
		);

		if (subs.length === 0) {
			// No subcategories — treat lvl1 itself as a single bucket
			buckets.push({
				lvl1,
				lvl2: null,
				count: lvl1List.find(x => x.value === lvl1).count,
			});
		} else {
			for (const sub of subs) {
				buckets.push({ lvl1, lvl2: sub.value, count: sub.count });
			}
		}
	}

	return buckets;
}

/**
 * Download products spread across lvl2 subcategory buckets.
 * @param {{ lvl1: string; lvl2: string | null; count: number }[]} buckets
 */
async function fetchProducts(buckets) {
	if (buckets.length === 0) {
		console.log(
			'No category buckets found — fetching products without filter.'
		);
		const result = await search(PRODUCTS_COLLECTION, {
			q: '*',
			per_page: TOTAL_PRODUCTS,
			page: 1,
			include_fields: PRODUCT_INCLUDE_FIELDS,
		});
		return hitsOf(result).map(h => h.document);
	}

	const perBucket = Math.max(1, Math.ceil(TOTAL_PRODUCTS / buckets.length));
	const allProducts = [];
	const seenIds = new Set();

	for (const { lvl1, lvl2 } of buckets) {
		if (allProducts.length >= TOTAL_PRODUCTS) {
			break;
		}

		const needed = Math.min(perBucket, TOTAL_PRODUCTS - allProducts.length);
		const label = lvl2 ?? lvl1;
		const filterField = lvl2
			? 'categories_by_level.lvl2'
			: 'categories_by_level.lvl1';
		const filterValue = lvl2 ?? lvl1;

		try {
			const result = await search(PRODUCTS_COLLECTION, {
				q: '*',
				filter_by: `${filterField}:=${filterValue}`,
				per_page: needed,
				page: 1,
				include_fields: PRODUCT_INCLUDE_FIELDS,
			});

			const hits = hitsOf(result);

			for (const hit of hits) {
				const doc = hit.document;
				if (!seenIds.has(doc.id)) {
					seenIds.add(doc.id);
					allProducts.push(doc);
				}
			}

			console.log(
				`  [${label}] fetched ${hits.length} (total: ${allProducts.length})`
			);
		} catch (err) {
			console.warn(`  [${label}] failed: ${err.message}`);
		}
	}

	// Back-fill if quota not met
	if (allProducts.length < TOTAL_PRODUCTS) {
		const remaining = TOTAL_PRODUCTS - allProducts.length;
		console.log(`Fetching ${remaining} more products without filter…`);

		const result = await search(PRODUCTS_COLLECTION, {
			q: '*',
			per_page: remaining,
			page: 1,
			include_fields: PRODUCT_INCLUDE_FIELDS,
		});

		for (const hit of hitsOf(result)) {
			const doc = hit.document;
			if (!seenIds.has(doc.id)) {
				seenIds.add(doc.id);
				allProducts.push(doc);
			}
		}
	}

	return allProducts.slice(0, TOTAL_PRODUCTS);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('Downloading metadata from Typesense…');
	console.log(`  Products collection : ${PRODUCTS_COLLECTION}`);
	console.log(`  Categories collection: ${CATEGORIES_COLLECTION}`);
	console.log(`  Target product count : ${TOTAL_PRODUCTS}`);
	console.log(`  Output directory     : ${OUT_DIR}`);
	console.log();

	// 1. Fetch categories (independent collection)
	const categories = await fetchCategories();

	// 2. Discover two-level category tree via product facets
	const buckets = await discoverCategoryBuckets();
	const lvl1Set = new Set(buckets.map(b => b.lvl1));
	console.log(
		`Found ${lvl1Set.size} top-level categories, ${buckets.length} lvl2 buckets`
	);
	for (const lvl1 of lvl1Set) {
		const subs = buckets.filter(b => b.lvl1 === lvl1);
		console.log(
			`  ${lvl1}: ${subs.map(s => `${(s.lvl2 ?? lvl1).replace(`${lvl1} > `, '')} (${s.count})`).join(', ')}`
		);
	}
	console.log();

	// 3. Fetch products spread across lvl2 subcategories
	const products = await fetchProducts(buckets);
	console.log(`\nDownloaded ${products.length} products total.`);

	// 4. Write output files
	await mkdir(OUT_DIR, { recursive: true });

	const categoriesPath = resolve(OUT_DIR, 'categories.json');
	const productsPath = resolve(OUT_DIR, 'products.json');

	await Promise.all([
		writeFile(categoriesPath, `${JSON.stringify(categories, null, 2)}\n`),
		writeFile(productsPath, `${JSON.stringify(products, null, 2)}\n`),
	]);

	console.log('\nWritten:');
	console.log(`  ${categoriesPath}`);
	console.log(`  ${productsPath}`);
}

main().catch(err => {
	console.error('Fatal error:', err);
	process.exit(1);
});
