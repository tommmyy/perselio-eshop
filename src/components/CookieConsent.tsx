import { useState, useEffect } from 'react';
import { msg } from '../i18n/index';

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

type ConsentValue = 'granted' | 'denied';

interface ConsentState {
	analytics_storage: ConsentValue;
	ad_storage: ConsentValue;
	ad_user_data: ConsentValue;
	ad_personalization: ConsentValue;
}

function getStoredConsent(): ConsentState | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie
		.split('; ')
		.find((c) => c.startsWith(`${COOKIE_NAME}=`));
	if (!match) return null;
	try {
		return JSON.parse(decodeURIComponent(match.split('=')[1]));
	} catch {
		return null;
	}
}

function setStoredConsent(consent: ConsentState) {
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function updateGtagConsent(consent: ConsentState) {
	window.gtag?.('consent', 'update', consent);
}

declare global {
	interface Window {
		dataLayer: Record<string, unknown>[];
		gtag?: (...args: unknown[]) => void;
	}
}

export default function CookieConsent() {
	const [visible, setVisible] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [analytics, setAnalytics] = useState(false);
	const [marketing, setMarketing] = useState(false);

	useEffect(() => {
		const stored = getStoredConsent();
		if (!stored) {
			setVisible(true);
		}
	}, []);

	function acceptAll() {
		const consent: ConsentState = {
			analytics_storage: 'granted',
			ad_storage: 'granted',
			ad_user_data: 'granted',
			ad_personalization: 'granted',
		};
		setStoredConsent(consent);
		updateGtagConsent(consent);
		setVisible(false);
	}

	function rejectAll() {
		const consent: ConsentState = {
			analytics_storage: 'denied',
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
		};
		setStoredConsent(consent);
		updateGtagConsent(consent);
		setVisible(false);
	}

	function savePreferences() {
		const consent: ConsentState = {
			analytics_storage: analytics ? 'granted' : 'denied',
			ad_storage: marketing ? 'granted' : 'denied',
			ad_user_data: marketing ? 'granted' : 'denied',
			ad_personalization: marketing ? 'granted' : 'denied',
		};
		setStoredConsent(consent);
		updateGtagConsent(consent);
		setVisible(false);
	}

	if (!visible) return null;

	return (
		<div
			role="dialog"
			aria-label={msg('cookie.title')}
			aria-modal="false"
			className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
		>
			<div className="mx-auto max-w-2xl rounded-[var(--radius-modal)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
				<h2 className="text-lg font-semibold mb-2">
					{msg('cookie.title')}
				</h2>
				<p className="text-sm text-[var(--color-muted)] mb-4">
					{msg('cookie.description')}
				</p>

				{showDetails && (
					<div className="mb-4 space-y-3 border-t border-[var(--color-border)] pt-4">
						{/* Necessary — always on */}
						<label className="flex items-center gap-3 text-sm">
							<input
								type="checkbox"
								checked
								disabled
								className="h-4 w-4 accent-[var(--color-primary)]"
							/>
							<span>
								<strong>{msg('cookie.necessary')}</strong>
								{' — '}
								{msg('cookie.necessaryDesc')}
							</span>
						</label>

						{/* Analytics */}
						<label className="flex items-center gap-3 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={analytics}
								onChange={(e) => setAnalytics(e.target.checked)}
								className="h-4 w-4 accent-[var(--color-primary)]"
							/>
							<span>
								<strong>{msg('cookie.analytics')}</strong>
								{' — '}
								{msg('cookie.analyticsDesc')}
							</span>
						</label>

						{/* Marketing */}
						<label className="flex items-center gap-3 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={marketing}
								onChange={(e) => setMarketing(e.target.checked)}
								className="h-4 w-4 accent-[var(--color-primary)]"
							/>
							<span>
								<strong>{msg('cookie.marketing')}</strong>
								{' — '}
								{msg('cookie.marketingDesc')}
							</span>
						</label>
					</div>
				)}

				<div className="flex flex-wrap gap-2">
					{!showDetails ? (
						<>
							<button
								onClick={acceptAll}
								className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity cursor-pointer"
							>
								{msg('cookie.acceptAll')}
							</button>
							<button
								onClick={rejectAll}
								className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] px-5 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
							>
								{msg('cookie.rejectAll')}
							</button>
							<button
								onClick={() => setShowDetails(true)}
								className="rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium text-[var(--color-muted)] underline underline-offset-2 hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
							>
								{msg('cookie.customize')}
							</button>
						</>
					) : (
						<>
							<button
								onClick={savePreferences}
								className="rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity cursor-pointer"
							>
								{msg('cookie.savePreferences')}
							</button>
							<button
								onClick={acceptAll}
								className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] px-5 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
							>
								{msg('cookie.acceptAll')}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
