import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { msg } from '../i18n/index';
import ProductCard from './ProductCard';
import type { Product } from '../lib/data';

interface Props {
	products: Product[];
	title: string;
	sectionId: string;
}

export default function ProductCarousel({ products, title, sectionId }: Props) {
	const scrollRef = useRef<HTMLDivElement>(null);

	function scroll(dir: 'left' | 'right') {
		if (!scrollRef.current) return;
		const amount = scrollRef.current.clientWidth * 0.8;
		scrollRef.current.scrollBy({
			left: dir === 'left' ? -amount : amount,
			behavior: 'smooth',
		});
	}

	if (!products.length) return null;

	return (
		<section data-section={sectionId} className="py-8">
			<div className="mx-auto max-w-[1280px] px-4">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold">{title}</h2>
					<div className="flex gap-2">
						<button
							onClick={() => scroll('left')}
							className="p-2 border-2 border-secondary rounded-[var(--radius-pill)] text-foreground hover:bg-secondary/10 transition-colors"
							aria-label={msg('a11y.scrollLeft')}
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<button
							onClick={() => scroll('right')}
							className="p-2 border-2 border-secondary rounded-[var(--radius-pill)] text-foreground hover:bg-secondary/10 transition-colors"
							aria-label={msg('a11y.scrollRight')}
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
				<div
					ref={scrollRef}
					className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
					style={{ scrollbarWidth: 'none' }}
				>
					{products.map(p => (
						<div
							key={p.id}
							className="snap-start shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
						>
							<ProductCard product={p} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
