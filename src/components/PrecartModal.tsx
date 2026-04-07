import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';
import ProductCard from './ProductCard';

interface PrecartData {
	productId: string;
	variantId: string;
	productName: string;
}

interface Props {
	allProducts: Product[];
}

export default function PrecartModal({ allProducts }: Props) {
	const [open, setOpen] = useState(false);
	const [data, setData] = useState<PrecartData | null>(null);

	useEffect(() => {
		function handleOpen(e: Event) {
			const detail = (e as CustomEvent<PrecartData>).detail;
			setData(detail);
			setOpen(true);
		}
		window.addEventListener('precart-open', handleOpen);
		return () => window.removeEventListener('precart-open', handleOpen);
	}, []);

	if (!open || !data) return null;

	const product = allProducts.find(p => p.id === data.productId);
	const lvl1 = product?.categoriesByLevel?.lvl1?.[0];
	const related = allProducts
		.filter(
			p =>
				p.id !== data.productId &&
				lvl1 &&
				p.categoriesByLevel?.lvl1?.includes(lvl1)
		)
		.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
		.slice(0, 6);

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center p-4"
			data-section="precart-modal"
		>
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={() => setOpen(false)}
			/>

			<div className="relative bg-white rounded-[var(--radius-modal)] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl">
				<button
					onClick={() => setOpen(false)}
					className="absolute top-4 right-4 p-1 text-muted hover:text-foreground"
					aria-label={msg('a11y.close')}
				>
					<X className="w-5 h-5" />
				</button>

				{product && (
					<div
						className="flex items-center gap-4 mb-6 pb-6 border-b border-border"
						data-product-id={product.id}
					>
						{product.imageUrls?.[0] && (
							<img
								src={product.imageUrls[0]}
								alt={product.name}
								className="w-20 h-20 object-cover rounded-[var(--radius-input)]"
							/>
						)}
						<div>
							<p className="text-sm text-muted mb-1">
								{msg('precart.addedToCart')}
							</p>
							<p className="font-semibold">{product.name}</p>
						</div>
					</div>
				)}

				<div className="flex gap-3 mb-6">
					<a
						href="/cart"
						className="flex-1 py-2 text-center border-2 border-secondary rounded-[var(--radius-pill)] font-semibold text-foreground hover:bg-secondary/10 transition-colors"
					>
						{msg('precart.viewCart')}
					</a>
					<button
						onClick={() => setOpen(false)}
						className="flex-1 py-2 text-center bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity"
					>
						{msg('precart.continueShopping')}
					</button>
				</div>

				{related.length > 0 && (
					<div data-section="precart-recommended-products">
						<h3 className="text-lg font-semibold mb-4">
							{msg('precart.youMightAlsoLike')}
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{related.map(p => (
								<ProductCard key={p.id} product={p} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
