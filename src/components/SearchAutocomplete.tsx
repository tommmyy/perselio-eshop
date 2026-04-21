import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, TrendingUp } from 'lucide-react';
import { msg } from '../i18n/index';
import { productDetailHref, formatPrice } from '../lib/utils';

export interface AutocompleteProduct {
	id: string;
	name: string;
	brand: string;
	price: number;
	priceOld?: number | null;
	imageUrl: string;
}

interface Props {
	products: AutocompleteProduct[];
	suggestions?: string[];
	placeholder?: string;
}

export default function SearchAutocomplete({
	products,
	suggestions = [],
	placeholder,
	...rest
}: Props) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const trimmed = query.trim().toLowerCase();

	const matchedTerms = useMemo(() => {
		if (!trimmed) {
			return suggestions.slice(0, 5);
		}
		return suggestions
			.filter(t => t.toLowerCase().includes(trimmed))
			.slice(0, 5);
	}, [trimmed, suggestions]);

	const matchedProducts = useMemo(() => {
		if (!trimmed) {
			return [];
		}
		return products
			.filter(
				p =>
					p.name.toLowerCase().includes(trimmed) ||
					p.brand.toLowerCase().includes(trimmed)
			)
			.slice(0, 5);
	}, [trimmed, products]);

	const totalItems = matchedTerms.length + matchedProducts.length;

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	// Reset active index on results change
	useEffect(() => {
		setActiveIndex(-1);
	}, [trimmed]);

	function handleSubmit(searchQuery: string) {
		if (searchQuery.trim()) {
			window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (!open) {
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setActiveIndex(i => (i < totalItems - 1 ? i + 1 : 0));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setActiveIndex(i => (i > 0 ? i - 1 : totalItems - 1));
				break;
			case 'Enter':
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < matchedTerms.length) {
					handleSubmit(matchedTerms[activeIndex]);
				} else if (activeIndex >= matchedTerms.length) {
					const product = matchedProducts[activeIndex - matchedTerms.length];
					if (product) {
						window.location.href = productDetailHref(product.id, product.name);
					}
				} else {
					handleSubmit(query);
				}
				setOpen(false);
				break;
			case 'Escape':
				setOpen(false);
				inputRef.current?.blur();
				break;
		}
	}

	// Scroll active item into view
	useEffect(() => {
		if (activeIndex < 0 || !listRef.current) {
			return;
		}
		const items = listRef.current.querySelectorAll('[data-autocomplete-item]');
		items[activeIndex]?.scrollIntoView({ block: 'nearest' });
	}, [activeIndex]);

	return (
		<div ref={wrapperRef} className="relative w-full">
			{/* Input */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={e => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder ?? msg('nav.searchPlaceholder')}
					className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] bg-surface-alt text-foreground placeholder:text-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
					role="combobox"
					aria-expanded={open}
					aria-autocomplete="list"
					aria-controls="search-autocomplete-list"
					aria-activedescendant={
						activeIndex >= 0 ? `autocomplete-item-${activeIndex}` : undefined
					}
					{...rest}
				/>
			</div>

			{/* Dropdown */}
			{open && (matchedTerms.length > 0 || matchedProducts.length > 0) && (
				<div
					ref={listRef}
					id="search-autocomplete-list"
					role="listbox"
					className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-[var(--radius-card)] shadow-lg z-50 max-h-[420px] overflow-y-auto"
				>
					{/* Search terms section */}
					{matchedTerms.length > 0 && (
						<div className="p-1">
							<p className="px-3 py-1.5 text-xs font-medium text-muted uppercase tracking-wider">
								{msg('autocomplete.suggestions')}
							</p>
							{matchedTerms.map((term, i) => (
								<button
									key={term}
									id={`autocomplete-item-${i}`}
									data-autocomplete-item
									role="option"
									aria-selected={activeIndex === i}
									className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-[var(--radius-input)] cursor-pointer transition-colors ${activeIndex === i
											? 'bg-surface-alt'
											: 'hover:bg-surface-alt'
										}`}
									onMouseEnter={() => setActiveIndex(i)}
									onMouseDown={e => {
										e.preventDefault();
										handleSubmit(term);
										setOpen(false);
									}}
								>
									<TrendingUp className="w-4 h-4 text-muted shrink-0" />
									<span className="flex-1 text-left">
										{trimmed ? highlightMatch(term, trimmed) : term}
									</span>
									<ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
								</button>
							))}
						</div>
					)}

					{/* Products section */}
					{matchedProducts.length > 0 && (
						<div className="p-1 border-t border-border">
							<p className="px-3 py-1.5 text-xs font-medium text-muted uppercase tracking-wider">
								{msg('autocomplete.products')}
							</p>
							{matchedProducts.map((product, i) => {
								const idx = matchedTerms.length + i;
								const href = productDetailHref(product.id, product.name);
								return (
									<a
										key={product.id}
										id={`autocomplete-item-${idx}`}
										data-autocomplete-item
										data-product-id={product.id}
										role="option"
										aria-selected={activeIndex === idx}
										href={href}
										className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-input)] cursor-pointer transition-colors ${activeIndex === idx
												? 'bg-surface-alt'
												: 'hover:bg-surface-alt'
											}`}
										onMouseEnter={() => setActiveIndex(idx)}
										onMouseDown={e => e.preventDefault()}
									>
										{/* Product image */}
										<div className="w-10 h-10 rounded bg-surface-alt shrink-0 overflow-hidden">
											{product.imageUrl ? (
												<img
													src={product.imageUrl}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-muted text-[10px]">
													—
												</div>
											)}
										</div>

										{/* Product info */}
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{product.name}
											</p>
											<p className="text-xs text-muted">{product.brand}</p>
										</div>

										{/* Price */}
										<div className="text-right shrink-0">
											<p className="text-sm font-semibold text-foreground">
												{formatPrice(product.price)}
											</p>
											{product.priceOld && product.priceOld > product.price && (
												<p className="text-xs text-muted line-through">
													{formatPrice(product.priceOld)}
												</p>
											)}
										</div>
									</a>
								);
							})}
						</div>
					)}

					{/* No results */}
					{trimmed &&
						matchedTerms.length === 0 &&
						matchedProducts.length === 0 && (
							<div className="px-3 py-4 text-center text-sm text-muted">
								{msg('autocomplete.noResults')}
							</div>
						)}
				</div>
			)}
		</div>
	);
}

function highlightMatch(text: string, query: string): React.ReactNode {
	const idx = text.toLowerCase().indexOf(query);
	if (idx < 0) {
		return text;
	}
	return (
		<>
			{text.slice(0, idx)}
			<span className="font-semibold text-primary">
				{text.slice(idx, idx + query.length)}
			</span>
			{text.slice(idx + query.length)}
		</>
	);
}
