import { z } from 'zod';

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
	id: z.string(),
	name: z.string(),
	totalItems: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Product — nested schemas
// ---------------------------------------------------------------------------

const categoriesByLevelSchema = z.object({
	lvl1: z.array(z.string()).optional(),
	lvl2: z.array(z.string()).optional(),
	lvl3: z.array(z.string()).optional(),
	lvl4: z.array(z.string()).optional(),
});

const variantImageSchema = z.object({
	url: z.string(),
});

const labelSchema = z.object({
	id: z.string(),
	text: z.string(),
	weight: z.number(),
	groups: z.array(z.string()),
	backgroundImageUrl: z.string().nullable().optional(),
	colorBackgroundHex: z.string().nullable().optional(),
	colorFontHex: z.string().nullable().optional(),
});

const variantPropertiesSchema = z.record(z.string(), z.unknown());

const variantSchema = z.object({
	id: z.string(),
	available: z.boolean(),
	price: z.number(),
	priceOld: z.number().nullable().optional(),
	url: z.string(),
	imageUrls: z.array(variantImageSchema).optional(),
	properties: variantPropertiesSchema.optional(),
});

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export const productSchema = z.object({
	id: z.string(),
	name: z.string(),
	brand: z.string(),
	description: z.string(),
	descriptionPerex: z.string(),
	description_perex: z.string(),
	url: z.string(),
	normalizedUrl: z.string(),
	normalized_url: z.string(),
	available: z.boolean(),
	gender: z.string(),
	price: z.number(),
	priceOld: z.number().nullable().optional(),
	price_old: z.number().nullable().optional(),

	// Identifiers
	itemId: z.string(),
	item_id: z.string(),

	// Images
	imageUrls: z.array(z.string()),
	image_urls: z.array(z.string()),

	// Taxonomy
	categories: z.array(z.string()),
	// categoriesIds: z.array(z.string()),
	// categoriesLeafs: z.array(z.string()),
	// categories_leafs: z.array(z.string()),
	categoriesByLevel: categoriesByLevelSchema,
	// categories_by_level: categoriesByLevelSchema,

	// Attributes
	colors: z.array(z.string()),
	sizes: z.array(z.string()),
	labels: z.array(labelSchema),

	// Variants
	variants: z.array(variantSchema),
	// normalizedVariantUrls: z.array(z.string()),
	// normalized_variant_urls: z.array(z.string()),

	// Embeddings (large float vectors — typically stripped for the demo)
	// description_embedding: z.array(z.number()).optional(),
	// description_embedding_content: z.string().optional(),
	// description_embedding_content_debug: z.unknown().nullable().optional(),
	// description_embedding_next_check_at: z.number().optional(),

	// Popularity metrics (optional — only on products with tracked activity)
	// popularity: z.number().optional(),
	// popularity_bucket: z.number().optional(),
	// recent_popularity: z.number().optional(),
	// recent_popularity_bucket: z.number().optional(),
	// update_popularity_batch_id: z.string().optional(),
	rating: z.number().optional(),

	// camelCase duplicates (legacy ingest format)
	// popularityBucket: z.number().optional(),
	// recentPopularity: z.number().optional(),
	// recentPopularityBucket: z.number().optional(),
	// updatePopularityBatchId: z.string().optional(),

	// Coupon (promotional)
	coupon_color: z.string().optional(),
	coupon_text: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Collection schemas (top-level JSON files)
// ---------------------------------------------------------------------------

export const productsFileSchema = z.array(productSchema);
export const categoriesFileSchema = z.array(categorySchema);
