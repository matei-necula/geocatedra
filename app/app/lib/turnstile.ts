// Cloudflare Turnstile verification — a second layer against distributed token/password
// guessing that per-IP rate limiting (lib/ratelimit.ts) alone can't stop
// (see docs/08-public-launch-runbook.md §3.2).
//
// Fails OPEN when unconfigured (see turnstileKeys() in lib/env.ts) — mirrors lib/ratelimit.ts's
// philosophy, so a forgotten `wrangler secret put` can never lock everyone out. Once BOTH keys
// are set, verification becomes mandatory and fails CLOSED: a missing, malformed, already-used,
// or Cloudflare-rejected token blocks the attempt.
//
// A network failure talking to Cloudflare's siteverify endpoint is ALSO treated as a rejection
// here (fail closed), not skipped. This was a judgment call: the alternative (fail open on a
// network error) would silently turn the check off at the exact moment load/flakiness might be
// caused by an attack, which defeats the point. And the cost is small — Turnstile sits on top of
// rate limiting that already exists (LOGIN_LIMITER / TOKEN_LIMITER), so a brief Cloudflare API
// blip means a locked-out admin can retry in a minute, not that the site goes down; that's a far
// smaller cost than the alternative failure mode.

import { clientIp } from "./ratelimit";
import type { TurnstileKeys } from "./env";

/** True once both keys are set — the point where verification becomes mandatory. */
export function turnstileConfigured(keys: TurnstileKeys): boolean {
	return keys.siteKey.length > 0 && keys.secretKey.length > 0;
}

/** Romanian message shown when the Turnstile challenge fails or wasn't completed. */
export const TURNSTILE_ERROR_MESSAGE =
	"Verificarea de securitate a eșuat. Reîncarcă pagina și încearcă din nou.";

interface SiteverifyResponse {
	success: boolean;
	"error-codes"?: string[];
}

/** Pure: interpret Cloudflare's siteverify response shape. Kept separate from the network call
 *  in verifyTurnstile() so it's unit-testable without mocking fetch. Any error code (missing
 *  token, invalid token, timeout-or-duplicate i.e. already redeemed, internal-error, ...) is
 *  just "not success" — callers fail closed the same way regardless of which one it was. */
export function siteverifySucceeded(response: SiteverifyResponse | null | undefined): boolean {
	return response?.success === true;
}

/** POSTs a widget response token to Cloudflare's siteverify endpoint. Returns false for a
 *  missing token, a rejected token, an HTTP-level error, or a network/parse failure — see the
 *  module comment above for why network failure fails closed here. */
export async function verifyTurnstile(token: string, secret: string, remoteIp: string): Promise<boolean> {
	if (!token) return false; // no point calling out for an empty token
	const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		if (!res.ok) return false;
		return siteverifySucceeded((await res.json()) as SiteverifyResponse);
	} catch {
		return false; // network/parse failure -> fail closed, see module comment
	}
}

/** Full check for a login action. No-op (returns null, i.e. "proceed") until both keys are
 *  configured — that's the only fail-open case. Once configured, reads the widget's response
 *  token (input name `cf-turnstile-response`, added to the form by the rendered widget) from
 *  the already-parsed FormData and verifies it. Returns a Romanian error string to show the
 *  user, or null if the attempt may proceed. Call this BEFORE the credential check, after the
 *  existing rate-limit check (so the rate limiter's behaviour is unchanged when Turnstile is
 *  off). */
export async function checkTurnstile(keys: TurnstileKeys, request: Request, form: FormData): Promise<string | null> {
	if (!turnstileConfigured(keys)) return null;
	const token = String(form.get("cf-turnstile-response") ?? "");
	const ok = await verifyTurnstile(token, keys.secretKey, clientIp(request));
	return ok ? null : TURNSTILE_ERROR_MESSAGE;
}
