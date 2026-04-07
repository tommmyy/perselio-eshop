import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from 'react';

const CART_KEY = 'perselio-cart';

export interface CartItem {
	productId: string;
	variantId: string;
	quantity: number;
}

interface CartContextValue {
	items: CartItem[];
	addItem: (productId: string, variantId: string, quantity?: number) => void;
	removeItem: (productId: string, variantId: string) => void;
	updateQuantity: (
		productId: string,
		variantId: string,
		quantity: number
	) => void;
	clearCart: () => void;
	totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(CART_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartItem[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		setItems(loadCart());
	}, []);

	useEffect(() => {
		saveCart(items);
		window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
	}, [items]);

	const addItem = useCallback(
		(productId: string, variantId: string, quantity = 1) => {
			setItems(prev => {
				const idx = prev.findIndex(
					i => i.productId === productId && i.variantId === variantId
				);
				if (idx >= 0) {
					const next = [...prev];
					next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
					return next;
				}
				return [...prev, { productId, variantId, quantity }];
			});
		},
		[]
	);

	const removeItem = useCallback((productId: string, variantId: string) => {
		setItems(prev =>
			prev.filter(
				i => !(i.productId === productId && i.variantId === variantId)
			)
		);
	}, []);

	const updateQuantity = useCallback(
		(productId: string, variantId: string, quantity: number) => {
			if (quantity <= 0) {
				removeItem(productId, variantId);
				return;
			}
			setItems(prev =>
				prev.map(i =>
					i.productId === productId && i.variantId === variantId
						? { ...i, quantity }
						: i
				)
			);
		},
		[removeItem]
	);

	const clearCart = useCallback(() => {
		setItems([]);
	}, []);

	const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

	return (
		<CartContext.Provider
			value={{
				items,
				addItem,
				removeItem,
				updateQuantity,
				clearCart,
				totalItems,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error('useCart must be used within CartProvider');
	return ctx;
}
