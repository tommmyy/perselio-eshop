import { msg } from '../i18n/index';

interface Props {
	productId: string;
	variantId: string;
	productName: string;
	className?: string;
}

function addToLocalCart(productId: string, variantId: string) {
	try {
		const raw = localStorage.getItem('perselio-cart');
		const items: { productId: string; variantId: string; quantity: number }[] =
			raw ? JSON.parse(raw) : [];
		const idx = items.findIndex(
			i => i.productId === productId && i.variantId === variantId
		);
		if (idx >= 0) {
			items[idx].quantity += 1;
		} else {
			items.push({ productId, variantId, quantity: 1 });
		}
		localStorage.setItem('perselio-cart', JSON.stringify(items));
		window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
	} catch {
		// noop
	}
}

export default function AddToCartButton({
	productId,
	variantId,
	productName,
	className = '',
}: Props) {
	function handleClick() {
		addToLocalCart(productId, variantId);
		window.dispatchEvent(
			new CustomEvent('precart-open', {
				detail: { productId, variantId, productName },
			})
		);
	}

	return (
		<button
			onClick={handleClick}
			className={`w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-[var(--radius-pill)] hover:opacity-90 transition-opacity cursor-pointer ${className}`}
		>
			{msg('product.addToCart')}
		</button>
	);
}
