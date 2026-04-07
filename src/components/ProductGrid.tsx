import ProductCard from './ProductCard';
import type { Product } from '../lib/data';

interface Props {
	products: Product[];
	title?: string;
	sectionId: string;
}

export default function ProductGrid({ products, title, sectionId }: Props) {
	if (!products.length) return null;

	return (
		<section data-section={sectionId} className="py-8">
			<div className="mx-auto max-w-[1280px] px-4">
				{title && <h2 className="text-2xl font-semibold mb-6">{title}</h2>}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{products.map(p => (
						<ProductCard key={p.id} product={p} />
					))}
				</div>
			</div>
		</section>
	);
}
