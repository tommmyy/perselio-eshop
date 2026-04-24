import { productDetailHref, formatPrice } from '../lib/utils';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';
import AddToCartButton from './AddToCartButton';

interface Props {
	product: Product;
	rank?: number;
}

export default function ProductRowCard({ product, rank }: Props) {
	const image = product.imageUrls?.[0] ?? '';
	const href = productDetailHref(product.id, product.name);
	const defaultVariant = product.variants?.[0];

	return (
		<div
			className="flex items-center gap-4 p-3 border-b border-border last:border-b-0 hover:bg-surface-alt/50 transition-colors"
			data-product-id={product.id}
			data-test-id="product-card"
		>
			{/* Rank badge */}
			{rank != null && (
				<span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
					{rank}
				</span>
			)}

			{/* Thumbnail */}
			<a
				href={href}
				className="shrink-0 w-16 h-16 rounded-[var(--radius-input)] overflow-hidden bg-surface-alt"
			>
				{image ? (
					<img
						src={image}
						alt={product.name}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted text-[10px]">
						{msg('product.noImage')}
					</div>
				)}
			</a>

			{/* Name + brand */}
			<a href={href} className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-foreground truncate">
					{product.name}
				</p>
				<p className="text-xs text-muted">{product.brand}</p>
			</a>

			{/* Price */}
			<div className="shrink-0 text-right">
				{product.priceOld && product.priceOld > product.price ? (
					<>
						<span className="text-sm font-bold text-destructive">
							{formatPrice(product.price)}
						</span>
						<span className="block text-xs text-muted line-through">
							{formatPrice(product.priceOld)}
						</span>
					</>
				) : (
					<span className="text-sm font-bold text-foreground">
						{formatPrice(product.price)}
					</span>
				)}
			</div>

			{/* Add to cart */}
			{defaultVariant && (
				<div className="shrink-0 hidden sm:block">
					<AddToCartButton
						productId={product.id}
						variantId={defaultVariant.id}
						productName={product.name}
						className="!w-auto !py-1.5 !px-3 !text-xs"
					/>
				</div>
			)}
		</div>
	);
}
