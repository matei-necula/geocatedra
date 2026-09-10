import { useEffect, useRef } from "react";

// Cloudflare Turnstile widget. See lib/turnstile.ts for the server-side no-op/fail-closed logic
// this pairs with. Renders nothing (null, no DOM at all) when no site key is configured — that's
// the SSR AND client-render output in that case, so there's no hydration mismatch to worry about
// on the off-path, which is the only path that exists until the owner sets up a widget.
//
// Once a site key IS set, the widget itself is rendered client-side only, via an effect that
// calls `window.turnstile.render()` explicitly rather than relying on the script's implicit
// auto-render (which scans the DOM for `.cf-turnstile[data-sitekey]` once, on script load). We
// need explicit rendering for two reasons: (1) SSR can't render the real widget (it's a 3rd-party
// script), so there is nothing for implicit auto-render to find in the pre-hydration markup
// anyway, and (2) a client-side React Router navigation onto a login page — e.g. session expired,
// redirected from /admin — doesn't reload the page, so the script's one-time DOM scan would never
// see a widget mounted after that point. Explicit render + cleanup on unmount handles both.

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface TurnstileRenderOptions {
	sitekey: string;
	language?: string;
	theme?: "light" | "dark" | "auto";
}

declare global {
	interface Window {
		turnstile?: {
			render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
			remove: (widgetId: string) => void;
		};
	}
}

// Cached across renders/mounts so a second <Turnstile> (or a re-mount after navigation) doesn't
// inject the <script> tag twice.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
	if (window.turnstile) return Promise.resolve();
	if (scriptPromise) return scriptPromise;
	scriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
		if (existing) {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", () => reject(new Error("nu s-a putut încărca scriptul Turnstile")));
			return;
		}
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("nu s-a putut încărca scriptul Turnstile"));
		document.head.appendChild(script);
	});
	return scriptPromise;
}

interface TurnstileProps {
	/** Public site key from the loader. Empty/undefined ⇒ render nothing (feature off). */
	siteKey: string | undefined;
}

/** Renders a Cloudflare Turnstile widget inside the enclosing <Form>. The widget injects its
 *  own hidden `cf-turnstile-response` input, which lib/turnstile.ts's checkTurnstile() reads
 *  server-side from the submitted FormData — no extra wiring needed here beyond mounting it
 *  inside the form. */
export function Turnstile({ siteKey }: TurnstileProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (!siteKey) return;
		let cancelled = false;
		loadTurnstileScript()
			.then(() => {
				if (cancelled || !containerRef.current || !window.turnstile) return;
				widgetIdRef.current = window.turnstile.render(containerRef.current, {
					sitekey: siteKey,
					language: "ro",
					theme: "auto", // matches the site's light/dark toggle (see ThemeToggle.tsx)
				});
			})
			.catch(() => {
				// Script blocked/offline: the container stays empty, so the form submits with no
				// `cf-turnstile-response`. Server-side checkTurnstile() then fails closed on the
				// missing token — same friendly error as a rejected challenge, no special-casing.
			});
		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
			}
			widgetIdRef.current = null;
		};
		// Re-run if the site key itself changes (shouldn't happen mid-session, but keeps the
		// widget correct rather than stale if it ever does).
	}, [siteKey]);

	if (!siteKey) return null;
	// No `data-sitekey` here on purpose — rendering is explicit (see effect above), so this div
	// is just a mount point, never scanned/auto-rendered by the script itself.
	return <div ref={containerRef} className="cf-turnstile my-1" />;
}
