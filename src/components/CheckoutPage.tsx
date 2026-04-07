import { useState, useEffect } from 'react';
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

export default function CheckoutPage({ allProducts }: Props) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		setItems(loadCart());
	}, []);

	const productMap = new Map(allProducts.map(p => [p.id, p]));

	const total = items.reduce((sum, item) => {
		const product = productMap.get(item.productId);
		const variant = product?.variants?.find(v => v.id === item.variantId);
		const price = variant?.price ?? product?.price ?? 0;
		return sum + price * item.quantity;
	}, 0);

	function handleSubmit() {
		localStorage.setItem('perselio-cart-snapshot', JSON.stringify(items));
		localStorage.removeItem('perselio-cart');
		window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
		window.location.href = '/checkout/success';
	}

	if (items.length === 0) {
		return (
			<div className="mx-auto max-w-[1280px] px-4 py-16 text-center">
				<h1 className="text-3xl font-semibold mb-4">{msg('checkout.title')}</h1>
				<p className="text-muted mb-6">{msg('checkout.empty')}</p>
				<a
					href="/"
					className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity"
				>
					{msg('checkout.continueShopping')}
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8">
			<h1 className="text-3xl font-semibold mb-8">{msg('checkout.title')}</h1>

			<div data-section="checkout-summary" className="space-y-3 mb-8">
				{items.map(item => {
					const product = productMap.get(item.productId);
					if (!product) return null;
					const variant = product.variants?.find(v => v.id === item.variantId);
					const price = variant?.price ?? product.price;

					return (
						<div
							key={`${item.productId}-${item.variantId}`}
							className="flex items-center justify-between py-3 border-b border-border"
						>
							<div>
								<p className="font-semibold">{product.name}</p>
								<p className="text-sm text-muted">
									{msg('checkout.variant', { id: item.variantId })}
									{' \u00B7 '}
									{msg('checkout.qty', { qty: item.quantity })}
								</p>
							</div>
							<p className="font-bold">{formatPrice(price * item.quantity)}</p>
						</div>
					);
				})}
			</div>

			<div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<p className="text-xl font-bold">
					{msg('checkout.total', { price: formatPrice(total) })}
				</p>
				<button
					onClick={handleSubmit}
					className="px-8 py-3 bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
				>
					{msg('checkout.submitOrder')}
				</button>
			</div>
		</div>
	);
}
