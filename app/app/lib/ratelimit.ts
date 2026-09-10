// Brute-force protection via Cloudflare's native rate-limiting bindings, configured under the
// TOP-LEVEL `ratelimits` key in wrangler.json — NOT under `unsafe.bindings`. The old shape is
// accepted by wrangler but deployed as "Unsafe Metadata", so the runtime never receives a
// `RateLimit` object and every limiter is silently dead. See docs/DECISIONS.md.
//
// Fails OPEN when a binding is missing (e.g. a context where it isn't configured) so a
// misconfiguration can never lock everyone out of the whole site. Failing open is why the
// misconfiguration above hid for months: a dead limiter looks exactly like a working one. So a
// missing binding is announced once per isolate — see `warnMissingLimiters`.

export interface RateLimitBinding {
	limit(opts: { key: string }): Promise<{ success: boolean }>;
}

/** Every limiter the app expects to find on `env`. Keep in sync with `ratelimits` in wrangler.json. */
export const RATE_LIMITERS = [
	"LOGIN_LIMITER",
	"TOKEN_LIMITER",
	"PRACTICE_LIMITER",
	"NICK_LIMITER",
	"DEMO_LIMITER",
	"REVIEW_LIMITER",
] as const satisfies readonly (keyof Env)[];

export type LimiterName = (typeof RATE_LIMITERS)[number];

/** Romanian message shown when an endpoint is rate-limited. */
export const RATE_LIMIT_MESSAGE = "Prea multe încercări. Așteaptă un minut și încearcă din nou.";

/** The client IP as seen by Cloudflare (spoof-resistant at the edge). */
export function clientIp(request: Request): string {
	return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

function limiterOf(env: unknown, binding: string): RateLimitBinding | undefined {
	const candidate = (env as Record<string, RateLimitBinding | undefined> | null | undefined)?.[binding];
	return candidate && typeof candidate.limit === "function" ? candidate : undefined;
}

/**
 * The expected limiters that are absent (or not a real `RateLimit` object) on this `env`.
 * Pure — the reporting wrapper is `warnMissingLimiters`.
 */
export function missingLimiters(env: unknown, expected: readonly string[] = RATE_LIMITERS): string[] {
	return expected.filter((name) => !limiterOf(env, name));
}

// Announced at most once per isolate, so a cold start logs one line instead of one per request.
let warned = false;

/** Resets the once-per-isolate latch. Tests only. */
export function resetLimiterWarning(): void {
	warned = false;
}

/**
 * Logs one line naming every missing limiter. Called from the worker entry so a bad deploy shows
 * up in `wrangler tail` on the first request, instead of hiding behind fail-open forever.
 */
export function warnMissingLimiters(env: unknown, log: (msg: string) => void = console.warn): void {
	if (warned) return;
	warned = true;
	const missing = missingLimiters(env);
	if (missing.length === 0) return;
	log(
		`[ratelimit] Binding-uri lipsă: ${missing.join(", ")}. Limitarea de rată e INACTIVĂ pentru ele ` +
			`(fail-open). Verifică cheia de prim rang "ratelimits" din wrangler.json — în dashboard ` +
			`trebuie să apară drept "Rate Limit", nu "Unsafe Metadata".`,
	);
}

/** Returns true if the caller is still under the limit (i.e. allowed to proceed). */
export async function underLimit(env: Env, binding: LimiterName, key: string): Promise<boolean> {
	const limiter = limiterOf(env, binding);
	if (!limiter) {
		warnMissingLimiters(env); // not configured → don't block, but say so once
		return true;
	}
	try {
		const { success } = await limiter.limit({ key });
		return success;
	} catch {
		return true;
	}
}
