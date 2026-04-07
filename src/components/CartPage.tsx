import { useState, useEffect } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';

interface CartItem {
	productId: string;
	variantId: string;
	quantity: number;
}

interface Props {
	allProducts: Product[];
}

function loadCart(): CartItem[] {
	try {
		const raw = localStorage.getItem('perselio-cart');
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartItem[]) {
	localStorage.setItem('perselio-cart', JSON.stringify(items));
	window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
}

export default function CartPage({ allProducts }: Props) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		setItems(loadCart());
	}, []);

	function updateQty(productId: string, variantId: string, delta: number) {
		setItems(prev => {
			const next = prev
				.map(i =>
					i.productId === productId && i.variantId === variantId
						? { ...i, quantity: i.quantity + delta }
						: i
				)
				.filter(i => i.quantity > 0);
			saveCart(next);
			return next;
		});
	}

	function removeItem(productId: string, variantId: string) {
		setItems(prev => {
			const next = prev.filter(
				i => !(i.productId === productId && i.variantId === variantId)
			);
			saveCart(next);
			return next;
		});
	}

	const productMap = new Map(allProducts.map(p => [p.id, p]));

	const total = items.reduce((sum, item) => {
		const product = productMap.get(item.productId);
		const variant = product?.variants?.find(v => v.id === item.variantId);
		const price = variant?.price ?? product?.price ?? 0;
		return sum + price * item.quantity;
	}, 0);

	if (items.length === 0) {
		return (
			<div className="mx-auto max-w-[1280px] px-4 py-16 text-center">
				<h1 className="text-3xl font-semibold mb-4">{msg('cart.title')}</h1>
				<p className="text-muted mb-6">{msg('cart.empty')}</p>
				<a
					href="/"
					className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity"
				>
					{msg('cart.continueShopping')}
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8">
			<h1 className="text-3xl font-semibold mb-8">{msg('cart.title')}</h1>

			<div data-section="cart-items" className="space-y-4 mb-8">
				{items.map(item => {
					const product = productMap.get(item.productId);
					if (!product) return null;
					const variant = product.variants?.find(v => v.id === item.variantId);
					const price = variant?.price ?? product.price;
					const image = product.imageUrls?.[0];

					return (
						<div
							key={`${item.productId}-${item.variantId}`}
							className="flex items-center gap-4 p-4 border border-border rounded-[var(--radius-card)]"
							data-product-id={item.productId}
						>
							{image && (
								<img
									src={image}
									alt={product.name}
									className="w-20 h-20 object-cover rounded-[var(--radius-input)]"
								/>
							)}
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold truncate">{product.name}</h3>
								<p className="text-sm text-muted">
									{msg('cart.variant', { id: item.variantId })}
								</p>
								<p className="text-sm font-bold mt-1">{formatPrice(price)}</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => updateQty(item.productId, item.variantId, -1)}
									className="p-1 border border-border rounded-[var(--radius-input)] hover:bg-surface-alt"
								>
									<Minus className="w-4 h-4" />
								</button>
								<span className="w-8 text-center font-semibold">
									{item.quantity}
								</span>
								<button
									onClick={() => updateQty(item.productId, item.variantId, 1)}
									className="p-1 border border-border rounded-[var(--radius-input)] hover:bg-surface-alt"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>
							<button
								onClick={() => removeItem(item.productId, item.variantId)}
								className="p-2 text-destructive hover:bg-destructive/10 rounded-[var(--radius-input)]"
								aria-label={msg('a11y.remove')}
							>
								<Trash2 className="w-5 h-5" />
							</button>
						</div>
					);
				})}
			</div>

			<div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<p className="text-xl font-bold">
					{msg('cart.total', { price: formatPrice(total) })}
				</p>
				<a
					href="/checkout"
					className="px-8 py-3 bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity"
				>
					{msg('cart.proceedToCheckout')}
				</a>
			</div>
		</div>
	);
}
