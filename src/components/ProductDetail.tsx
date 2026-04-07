import { useState } from 'react';
import { formatPrice } from '../lib/utils';
import { msg } from '../i18n/index';
import type { Product } from '../lib/data';
import AddToCartButton from './AddToCartButton';

interface Props {
	product: Product;
}

export default function ProductDetail({ product }: Props) {
	const [selectedImage, setSelectedImage] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState(0);

	const images = product.imageUrls ?? [];
	const variant = product.variants?.[selectedVariant];

	const sizes = [...new Set(product.sizes ?? [])];
	const colors = [...new Set(product.colors ?? [])];

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Image gallery */}
				<div>
					<div className="aspect-square rounded-[var(--radius-card)] overflow-hidden bg-surface-alt mb-4">
						{images[selectedImage] ? (
							<img
								src={images[selectedImage]}
								alt={product.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-muted">
								{msg('product.noImage')}
							</div>
						)}
					</div>
					{images.length > 1 && (
						<div className="flex gap-2 overflow-x-auto">
							{images.map((im, i) => (
								<button
									key={i}
									onClick={() => setSelectedImage(i)}
									className={`w-16 h-16 rounded-[var(--radius-input)] overflow-hidden border-2 shrink-0 transition-colors ${
										i === selectedImage ? 'border-primary' : 'border-border'
									}`}
								>
									<img src={im} alt="" className="w-full h-full object-cover" />
								</button>
							))}
						</div>
					)}
				</div>

				{/* Product info */}
				<div>
					<p className="text-sm text-muted mb-1">{product.brand}</p>
					<h1 className="text-2xl font-semibold mb-4">{product.name}</h1>

					<div className="flex items-baseline gap-3 mb-6">
						{product.priceOld && product.priceOld > product.price ? (
							<>
								<span className="text-2xl font-bold text-destructive">
									{formatPrice(product.price)}
								</span>
								<span className="text-lg text-muted line-through">
									{formatPrice(product.priceOld)}
								</span>
							</>
						) : (
							<span className="text-2xl font-bold text-foreground">
								{formatPrice(product.price)}
							</span>
						)}
					</div>

					{/* Size selector */}
					{sizes.length > 0 && (
						<div className="mb-4">
							<p className="text-sm font-semibold mb-2">
								{msg('product.size')}
							</p>
							<div className="flex flex-wrap gap-2">
								{sizes.map(size => (
									<span
										key={size}
										className="px-3 py-1 border border-border rounded-[var(--radius-input)] text-sm text-foreground"
									>
										{size}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Color selector */}
					{colors.length > 0 && (
						<div className="mb-4">
							<p className="text-sm font-semibold mb-2">
								{msg('product.color')}
							</p>
							<div className="flex flex-wrap gap-2">
								{colors.map(color => (
									<span
										key={color}
										className="px-3 py-1 border border-border rounded-[var(--radius-input)] text-sm text-foreground"
									>
										{color}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Variant selector */}
					{product.variants.length > 1 && (
						<div className="mb-6">
							<p className="text-sm font-semibold mb-2">
								{msg('product.variant')}
							</p>
							<select
								value={selectedVariant}
								onChange={e => setSelectedVariant(Number(e.target.value))}
								className="w-full p-2 border border-border rounded-[var(--radius-input)] text-foreground bg-white"
							>
								{product.variants.map((v, i) => (
									<option key={v.id} value={i}>
										{v.id} — {formatPrice(v.price)}
										{!v.available && ` ${msg('product.soldOut')}`}
									</option>
								))}
							</select>
						</div>
					)}

					{variant && (
						<div className="max-w-xs">
							<AddToCartButton
								productId={product.id}
								variantId={variant.id}
								productName={product.name}
							/>
						</div>
					)}

					{/* Description */}
					<div className="mt-8">
						<h2 className="text-lg font-semibold mb-2">
							{msg('product.description')}
						</h2>
						<p className="text-muted leading-relaxed">
							{product.description || product.descriptionPerex}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
