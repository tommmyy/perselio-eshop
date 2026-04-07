import en from './en.json';
import cs from './cs.json';

type Messages = Record<string, string>;

const catalogs: Record<string, Messages> = { en, cs };

/**
 * Locale resolved at build time from `SHOP_LOCALE` env var.
 * Defaults to `en`.
 */
export const locale: string =
	(import.meta as any).env?.SHOP_LOCALE ??
	(typeof process !== 'undefined' ? process.env.SHOP_LOCALE : undefined) ??
	'en';

const messages: Messages = catalogs[locale] ?? catalogs.en;

/**
 * Translate a message key with optional interpolation.
 *
 * ```ts
 * msg('cart.total', { price: '100 Kč' }) // "Total: 100 Kč"
 * ```
 */
export function msg(
	key: string,
	params?: Record<string, string | number>
): string {
	let text = messages[key] ?? catalogs.en[key] ?? key;
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			text = text.replaceAll(`{${k}}`, String(v));
		}
	}
	return text;
}

/** HTML lang attribute value */
export const htmlLang = locale === 'cs' ? 'cs' : 'en';

/**
 * Locale-aware price formatter.
 */
export function formatPrice(price: number): string {
	const loc = locale === 'cs' ? 'cs-CZ' : 'en-US';
	const currency = locale === 'cs' ? 'CZK' : 'CZK'; // product data is always CZK
	return new Intl.NumberFormat(loc, {
		style: 'currency',
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(price);
}
