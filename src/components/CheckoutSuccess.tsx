import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
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

declare global {
	interface Window {
		dataLayer: Record<string, unknown>[];
	}
}

export default function CheckoutSuccess({ allProducts }: Props) {
	const [items, setItems] = useState<CartItem[]>([]);
	const productMap = new Map(allProducts.map(p => [p.id, p]));

	useEffect(() => {
		try {
			const raw = localStorage.getItem('perselio-cart-snapshot');
			if (raw) {
				const parsed: CartItem[] = JSON.parse(raw);
				setItems(parsed);
				localStorage.removeItem('perselio-cart-snapshot');

				// GA4 ecommerce: purchase
				const transactionId = `T-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
				const ga4Items = parsed.map((item, index) => {
					const product = productMap.get(item.productId);
					const variant = product?.variants?.find(v => v.id === item.variantId);
					const price = variant?.price ?? product?.price ?? 0;
					return {
						item_id: item.productId,
						item_name: product?.name ?? '',
						item_brand: product?.brand ?? '',
						item_category: product?.categories?.[0] ?? '',
						item_variant: item.variantId,
						price,
						quantity: item.quantity,
						index,
					};
				});

				const value = ga4Items.reduce((sum, i) => sum + i.price * i.quantity, 0);

				window.dataLayer = window.dataLayer || [];
				window.dataLayer.push({ ecommerce: null }); // clear previous ecommerce data
				window.dataLayer.push({
					event: 'purchase',
					ecommerce: {
						transaction_id: transactionId,
						value,
						currency: 'CZK',
						items: ga4Items,
					},
				});
			}
			localStorage.removeItem('perselio-cart');
			window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
		} catch {
			// noop
		}
	}, []);

	const total = items.reduce((sum, item) => {
		const product = productMap.get(item.productId);
		const variant = product?.variants?.find(v => v.id === item.variantId);
		const price = variant?.price ?? product?.price ?? 0;
		return sum + price * item.quantity;
	}, 0);

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-16 text-center">
			<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
			<h1 className="text-3xl font-semibold mb-2">
				{msg('checkoutSuccess.heading')}
			</h1>
			<p className="text-muted mb-8">{msg('checkoutSuccess.message')}</p>

			{items.length > 0 && (
				<div className="max-w-md mx-auto text-left mb-8">
					<h2 className="text-lg font-semibold mb-4">
						{msg('checkoutSuccess.orderSummary')}
					</h2>
					<div className="space-y-2">
						{items.map(item => {
							const product = productMap.get(item.productId);
							if (!product) return null;
							const variant = product.variants?.find(
								v => v.id === item.variantId
							);
							const price = variant?.price ?? product.price;

							return (
								<div
									key={`${item.productId}-${item.variantId}`}
									className="flex justify-between py-2 border-b border-border"
								>
									<span>
										{product.name} x{item.quantity}
									</span>
									<span className="font-bold">
										{formatPrice(price * item.quantity)}
									</span>
								</div>
							);
						})}
					</div>
					<div className="flex justify-between mt-4 pt-2 border-t border-border">
						<span className="font-bold">{msg('checkoutSuccess.total')}</span>
						<span className="font-bold text-lg">{formatPrice(total)}</span>
					</div>
				</div>
			)}

			<a
				href="/"
				className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius-pill)] font-semibold hover:opacity-90 transition-opacity"
			>
				{msg('checkoutSuccess.backToHomepage')}
			</a>
		</div>
	);
}
