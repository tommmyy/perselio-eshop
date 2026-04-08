import { productDetailHref, formatPrice } from '../lib/utils';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';
import AddToCartButton from './AddToCartButton';

interface Props {
	product: Product;
}

export default function ProductCard({ product }: Props) {
	const image = product.imageUrls?.[0] ?? '';
	const href = productDetailHref(product.id, product.name);
	const defaultVariant = product.variants?.[0];

	return (
		<div
			className="group bg-white border border-border rounded-[var(--radius-card)] overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:shadow-md flex flex-col"
			data-product-id={product.id}
		>
			<a
				href={href}
				className="block aspect-[3/4] overflow-hidden bg-surface-alt"
			>
				{image ? (
					<img
						src={image}
						alt={product.name}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted text-sm">
						{msg('product.noImage')}
					</div>
				)}
			</a>
			<div className="p-4 flex flex-col flex-1">
				<a href={href} className="block flex-1">
					<h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
						{product.name}
					</h3>
					<p className="text-xs text-muted mb-2">{product.brand}</p>
				</a>
				<div className="flex items-baseline gap-2 mb-3">
					{product.priceOld && product.priceOld > product.price ? (
						<>
							<span className="text-sm font-bold text-destructive">
								{formatPrice(product.price)}
							</span>
							<span className="text-xs text-muted line-through">
								{formatPrice(product.priceOld)}
							</span>
						</>
					) : (
						<span className="text-sm font-bold text-foreground">
							{formatPrice(product.price)}
						</span>
					)}
				</div>
				{defaultVariant && (
					<AddToCartButton
						productId={product.id}
						variantId={defaultVariant.id}
						productName={product.name}
					/>
				)}
			</div>
		</div>
	);
}
