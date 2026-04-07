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

export default function CheckoutSuccess({ allProducts }: Props) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		try {
			const raw = localStorage.getItem('perselio-cart-snapshot');
			if (raw) {
				setItems(JSON.parse(raw));
				localStorage.removeItem('perselio-cart-snapshot');
			}
			localStorage.removeItem('perselio-cart');
			window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
		} catch {
			// noop
		}
	}, []);

	const productMap = new Map(allProducts.map(p => [p.id, p]));

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
