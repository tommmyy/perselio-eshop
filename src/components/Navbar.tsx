import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { msg } from '../i18n/index';
import SearchAutocomplete from './SearchAutocomplete';
import type { AutocompleteProduct } from './SearchAutocomplete';

export interface NavCategory {
	name: string;
	slug: string;
	subcategories: string[];
}

interface Props {
	categories: NavCategory[];
	autocompleteProducts?: AutocompleteProduct[];
	searchSuggestions?: string[];
}

export default function Navbar({
	categories,
	autocompleteProducts = [],
	searchSuggestions = [],
}: Props) {
	const [cartCount, setCartCount] = useState(0);
	const [menuOpen, setMenuOpen] = useState(false);
	const [catOpen, setCatOpen] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function updateCount() {
			try {
				const raw = localStorage.getItem('perselio-cart');
				const items = raw ? JSON.parse(raw) : [];
				setCartCount(
					items.reduce(
						(s: number, i: { quantity: number }) => s + i.quantity,
						0
					)
				);
			} catch {
				setCartCount(0);
			}
		}
		updateCount();
		window.addEventListener('cart-updated', updateCount);
		window.addEventListener('storage', updateCount);
		return () => {
			window.removeEventListener('cart-updated', updateCount);
			window.removeEventListener('storage', updateCount);
		};
	}, []);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (catRef.current && !catRef.current.contains(e.target as Node)) {
				setCatOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<nav className="sticky top-0 z-50 bg-surface border-b border-border">
			{/* Main bar */}
			<div className="mx-auto max-w-[1280px] px-4 h-16 flex items-center justify-between gap-4">
				{/* Logo */}
				<a href="/" className="text-xl font-bold text-foreground shrink-0">
					{msg('site.name')}
				</a>

				{/* Desktop: Categories dropdown */}
				<div ref={catRef} className="relative hidden md:block">
					<button
						onClick={() => setCatOpen(!catOpen)}
						className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
					>
						{msg('nav.categories')}
						<ChevronDown
							className={`w-4 h-4 transition-transform ${catOpen ? 'rotate-180' : ''}`}
						/>
					</button>
					{catOpen && (
						<div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-[var(--radius-card)] shadow-lg py-2 z-50 max-h-[70vh] overflow-y-auto">
							{categories.map(cat => (
								<a
									key={cat.slug}
									href={`/category/${cat.slug}`}
									className="block px-4 py-2 text-sm text-foreground hover:bg-surface-alt transition-colors"
									onClick={() => setCatOpen(false)}
								>
									{cat.name}
								</a>
							))}
						</div>
					)}
				</div>

				{/* Search - desktop */}
				<div className="hidden md:block flex-1 max-w-md mx-4">
					<SearchAutocomplete
						data-test="desktop-search-input"
						products={autocompleteProducts}
						suggestions={searchSuggestions}
					/>
				</div>

				{/* Right side */}
				<div className="flex items-center gap-3">
					{/* Cart */}
					<a href="/cart" className="relative p-2">
						<ShoppingBag className="w-6 h-6 text-foreground" />
						{cartCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
								{cartCount > 99 ? '99+' : cartCount}
							</span>
						)}
					</a>

					{/* Hamburger */}
					<button
						className="md:hidden p-2"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label={msg('nav.toggleMenu')}
					>
						{menuOpen ? (
							<X className="w-6 h-6" />
						) : (
							<Menu className="w-6 h-6" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{menuOpen && (
				<div className="md:hidden border-t border-border px-4 py-4 bg-surface">
					{/* Search */}
					<div className="mb-4">
						<SearchAutocomplete
							data-test="mobile-search-input"
							products={autocompleteProducts}
							suggestions={searchSuggestions}
						/>
					</div>

					{/* Category links */}
					<p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
						{msg('nav.categories')}
					</p>
					<ul className="space-y-1 mb-4">
						{categories.map(cat => (
							<li key={cat.slug}>
								<a
									href={`/category/${cat.slug}`}
									className="block py-2 px-2 text-sm text-foreground hover:bg-surface-alt rounded-[var(--radius-input)] transition-colors"
									onClick={() => setMenuOpen(false)}
								>
									{cat.name}
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</nav>
	);
}
