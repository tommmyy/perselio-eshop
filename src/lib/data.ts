import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from './utils';

const DATA_DIR = join(process.cwd(), 'data');

export interface Category {
	id: string;
	name: string;
	popularity?: number;
}

export interface VariantImage {
	url: string;
}

export interface Variant {
	id: string;
	available: boolean;
	price: number;
	priceOld?: number | null;
	url: string;
	imageUrls?: VariantImage[];
	properties?: Record<string, unknown>;
}

export interface Product {
	id: string;
	name: string;
	brand: string;
	description: string;
	descriptionPerex: string;
	url: string;
	available: boolean;
	price: number;
	priceOld?: number | null;
	imageUrls: string[];
	categories: string[];
	categoriesByLevel: {
		lvl1?: string[];
		lvl2?: string[];
		lvl3?: string[];
		lvl4?: string[];
	};
	colors: string[];
	sizes: string[];
	variants: Variant[];
	popularity?: number;
}

let _products: Product[] | null = null;
let _categories: Category[] | null = null;

export function getProducts(): Product[] {
	if (!_products) {
		const raw = readFileSync(join(DATA_DIR, 'products.json'), 'utf-8');
		_products = JSON.parse(raw) as Product[];
	}
	return _products;
}

export function getCategories(): Category[] {
	if (!_categories) {
		const raw = readFileSync(join(DATA_DIR, 'categories.json'), 'utf-8');
		_categories = JSON.parse(raw) as Category[];
	}
	return _categories;
}

export interface TopLevelCategory {
	name: string;
	slug: string;
	subcategories: string[];
	products: Product[];
}

export function getTopLevelCategories(): TopLevelCategory[] {
	const products = getProducts();
	const catMap = new Map<
		string,
		{ subcats: Set<string>; products: Product[] }
	>();

	for (const p of products) {
		const lvl1List = p.categoriesByLevel?.lvl1 ?? [];
		const lvl2List = p.categoriesByLevel?.lvl2 ?? [];

		for (const cat of lvl1List) {
			if (!catMap.has(cat)) {
				catMap.set(cat, { subcats: new Set(), products: [] });
			}
			const entry = catMap.get(cat)!;
			entry.products.push(p);
			for (const sub of lvl2List) {
				entry.subcats.add(sub);
			}
		}
	}

	return Array.from(catMap.entries()).map(([name, data]) => ({
		name,
		slug: slugify(name),
		subcategories: Array.from(data.subcats),
		products: data.products,
	}));
}

export interface Subcategory {
	/** Full lvl2 value, e.g. "Dámské > Spodní prádlo" */
	fullName: string;
	/** Display label, e.g. "Spodní prádlo" */
	label: string;
	slug: string;
	parentSlug: string;
	products: Product[];
}

export function getSubcategories(): Subcategory[] {
	const products = getProducts();
	const subMap = new Map<string, { parentSlug: string; products: Product[] }>();

	for (const p of products) {
		const lvl1List = p.categoriesByLevel?.lvl1 ?? [];
		const lvl2List = p.categoriesByLevel?.lvl2 ?? [];

		for (const fullName of lvl2List) {
			if (!subMap.has(fullName)) {
				const parentName = lvl1List[0] ?? fullName.split(' > ')[0];
				subMap.set(fullName, {
					parentSlug: slugify(parentName),
					products: [],
				});
			}
			subMap.get(fullName)!.products.push(p);
		}
	}

	return Array.from(subMap.entries()).map(([fullName, data]) => {
		const parts = fullName.split(' > ');
		const label = parts.length > 1 ? parts.slice(1).join(' > ') : fullName;
		return {
			fullName,
			label,
			slug: slugify(label),
			parentSlug: data.parentSlug,
			products: data.products,
		};
	});
}

export function getRelatedProducts(product: Product, max = 10): Product[] {
	const products = getProducts();
	const lvl1 = product.categoriesByLevel?.lvl1?.[0];
	if (!lvl1) return [];

	return products
		.filter(
			p => p.id !== product.id && p.categoriesByLevel?.lvl1?.includes(lvl1)
		)
		.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
		.slice(0, max);
}

export function getRecommendedProducts(product: Product, max = 10): Product[] {
	const products = getProducts();
	const lvl1 = product.categoriesByLevel?.lvl1?.[0];

	return products
		.filter(
			p =>
				p.id !== product.id &&
				(!lvl1 || !p.categoriesByLevel?.lvl1?.includes(lvl1))
		)
		.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
		.slice(0, max);
}

export function shuffleArray<T>(arr: T[]): T[] {
	const shuffled = [...arr];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
