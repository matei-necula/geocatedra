// Server-side secret access. Values come from Cloudflare (`.dev.vars` locally,
// `wrangler secret put` in production). Dev fallbacks keep localhost frictionless;
// production MUST set real secrets.

export interface ServerSecrets {
	sessionSecret: string;
	adminPassword: string;
	signupPassword: string;
}

export function getSecrets(env: Env): ServerSecrets {
	const e = env as unknown as Record<string, string | undefined>;

	// Dev fallbacks keep localhost frictionless. In production (built worker) we FAIL CLOSED:
	// a forgotten `wrangler secret put` must not silently leave the app on public defaults
	// (a known SESSION_SECRET lets anyone forge admin/teacher/student cookies).
	function required(name: string, devFallback: string): string {
		const v = e[name];
		if (v && v.length > 0) return v;
		if (import.meta.env.DEV) return devFallback;
		throw new Error(`Missing required secret ${name}. Set it: npx wrangler secret put ${name}`);
	}

	// Câmpurile se rezolvă LENEȘ (getteri, nu proprietăți simple): instanța liberă nu are nici
	// admin, nici înregistrare de profesor, deci nu are `ADMIN_PASSWORD`/`SIGNUP_PASSWORD` — dar
	// ruta ei de exersează cere doar `sessionSecret`. Cu rezolvare eageră, orice apel la
	// `getSecrets(env)` arunca imediat dacă lipsea oricare secret, chiar dacă apelantul nu-l
	// citea niciodată. Pe instanța cu clase comportamentul rămâne identic: fiecare rută citește
	// exact aceleași câmpuri ca înainte, doar că verificarea se face la citirea proprietății, nu
	// la construcția obiectului — invizibil pentru un apelant care citește imediat.
	return {
		get sessionSecret() {
			return required("SESSION_SECRET", "dev-insecure-session-secret-change-me");
		},
		get adminPassword() {
			return required("ADMIN_PASSWORD", "admin");
		},
		get signupPassword() {
			return required("SIGNUP_PASSWORD", "profesor");
		},
	};
}

/** Whether teachers must confirm their e-mail before using the account. Off by default —
 *  turn on (set var REQUIRE_EMAIL_VERIFICATION="true") only once a verified Resend sending
 *  domain exists, otherwise teachers can't receive the link. */
export function emailVerificationRequired(env: Env): boolean {
	const e = env as unknown as Record<string, string | undefined>;
	return e.REQUIRE_EMAIL_VERIFICATION === "true";
}

export interface TurnstileKeys {
	siteKey: string;
	secretKey: string;
}

/** Cloudflare Turnstile keys. Unlike getSecrets() above, this does NOT fail closed when
 *  missing — Turnstile is a no-op (widget hidden, verification skipped) until the owner
 *  creates a widget in the Cloudflare dashboard and sets both values (see docs/run-guide.md).
 *  Empty string means "not configured". Site key is public by design (it's sent to the
 *  browser); secret key must never leave the server. */
export function turnstileKeys(env: Env): TurnstileKeys {
	const e = env as unknown as Record<string, string | undefined>;
	return {
		siteKey: e.TURNSTILE_SITE_KEY ?? "",
		secretKey: e.TURNSTILE_SECRET_KEY ?? "",
	};
}

/**
 * Jetonul balizei Cloudflare Web Analytics (instanța liberă).
 *
 * Ca și `turnstileKeys` — și SPRE DEOSEBIRE de `getSecrets` — nu cade închis: cât timp
 * variabila lipsește sau e goală, `root.tsx` nu randează nimic, iar site-ul funcționează
 * exact ca până acum. Adică se poate desfășura codul înainte ca proprietara să apuce să
 * creeze site-ul în panoul Cloudflare.
 *
 * Nu e un secret: jetonul ajunge oricum în HTML-ul fiecărei pagini, ca și cheia publică de
 * Turnstile. De-aia stă în `vars` din wrangler.json, nu în `wrangler secret put`.
 *
 * Cloudflare Web Analytics e fără cookie-uri și fără amprentare — de-aia el, și nu altceva:
 * pagina `/confidentialitate` spune că site-ul liber nu pune niciun cookie, iar afirmația
 * aia trebuie să rămână adevărată.
 */
export function analyticsToken(env: Env): string {
	const e = env as unknown as Record<string, string | undefined>;
	return e.CF_BEACON_TOKEN ?? "";
}
