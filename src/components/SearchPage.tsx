import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';

interface Props {
	products: Product[];
}

const ITEMS_PER_PAGE = 20;

export default function SearchPage({ products }: Props) {
	const [query, setQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const q = params.get('q') || '';
		const page = parseInt(params.get('page') || '1', 10);
		setQuery(q);
		setCurrentPage(page > 0 ? page : 1);
	}, []);

	const filteredProducts = useMemo(() => {
		if (!query.trim()) return [];

		const lowerQuery = query.toLowerCase().trim();
		return products.filter(
			p =>
				p.name.toLowerCase().includes(lowerQuery) ||
				p.brand.toLowerCase().includes(lowerQuery) ||
				p.description.toLowerCase().includes(lowerQuery)
		);
	}, [query, products]);

	const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

	// Reset to page 1 when query changes
	useEffect(() => {
		setCurrentPage(1);
	}, [query]);

	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });

		// Update URL without reloading
		const url = new URL(window.location.href);
		url.searchParams.set('page', String(page));
		window.history.pushState({}, '', url);
	}

	if (!query.trim()) {
		return (
			<div className="mx-auto max-w-[1280px] px-4 py-8">
				<h1 className="text-3xl font-semibold mb-6">{msg('search.heading')}</h1>
				<p className="text-muted">{msg('search.emptyQuery')}</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8">
			<h1 className="text-3xl font-semibold mb-2">
				{msg('search.resultsFor', { query })}
			</h1>
			<p className="text-muted mb-6">
				{msg('search.resultsCount', { count: filteredProducts.length })}
			</p>

			{filteredProducts.length > 0 ? (
				<>
					<div
						className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
						data-section="search-results"
					>
						{paginatedProducts.map(p => (
							<ProductCard key={p.id} product={p} />
						))}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div
							className="mt-8 flex items-center justify-center gap-2"
							data-pagination="search"
						>
							<button
								onClick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-input)] border border-border bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt transition-colors"
								aria-label={msg('pagination.previous')}
								data-pagination-prev
							>
								<ChevronLeft className="w-4 h-4" />
								<span className="hidden sm:inline">
									{msg('pagination.previous')}
								</span>
							</button>

							<div className="flex items-center gap-1">
								{generatePageNumbers(currentPage, totalPages).map((page, i) =>
									page === '...' ? (
										<span
											key={`ellipsis-${i}`}
											className="px-3 py-2 text-muted"
										>
											…
										</span>
									) : (
										<button
											key={page}
											onClick={() => goToPage(Number(page))}
											className={`px-3 py-2 rounded-[var(--radius-input)] border transition-colors ${
												currentPage === Number(page)
													? 'border-primary bg-primary text-primary-foreground font-semibold'
													: 'border-border bg-white text-foreground hover:bg-surface-alt'
											}`}
											data-pagination-page={page}
										>
											{page}
										</button>
									)
								)}
							</div>

							<button
								onClick={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-input)] border border-border bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt transition-colors"
								aria-label={msg('pagination.next')}
								data-pagination-next
							>
								<span className="hidden sm:inline">
									{msg('pagination.next')}
								</span>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					)}
				</>
			) : (
				<div className="text-center py-12">
					<p className="text-lg text-foreground mb-2">
						{msg('search.noResults')}
					</p>
					<p className="text-muted">{msg('search.noResultsHint')}</p>
				</div>
			)}
		</div>
	);
}

/**
 * Generate page numbers with ellipsis for large page counts.
 * Shows: 1 ... 4 5 [6] 7 8 ... 20
 */
function generatePageNumbers(
	current: number,
	total: number
): (number | string)[] {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const pages: (number | string)[] = [];

	// Always show first page
	pages.push(1);

	// Show ellipsis or pages around current
	if (current > 3) {
		pages.push('...');
	}

	// Show 2 pages before and after current
	for (
		let i = Math.max(2, current - 2);
		i <= Math.min(total - 1, current + 2);
		i++
	) {
		pages.push(i);
	}

	// Show ellipsis or last pages
	if (current < total - 2) {
		pages.push('...');
	}

	// Always show last page
	if (total > 1) {
		pages.push(total);
	}

	return pages;
}
