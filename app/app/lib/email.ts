import { signPayload, verifyPayload } from "./crypto";

// Email verification token (stateless: HMAC-signed, no DB row needed).
interface VerifyPayload {
	k: "verify-email";
	userId: string;
	email: string;
	exp: number;
}

const TTL = 24 * 60 * 60 * 1000; // 24h

export async function makeVerifyToken(userId: string, email: string, secret: string): Promise<string> {
	return signPayload({ k: "verify-email", userId, email, exp: Date.now() + TTL }, secret);
}

export async function readVerifyToken(
	token: string,
	secret: string,
): Promise<{ userId: string; email: string } | null> {
	const p = await verifyPayload<VerifyPayload>(token, secret);
	if (!p || p.k !== "verify-email" || p.exp < Date.now()) return null;
	return { userId: p.userId, email: p.email };
}

export function verifyLink(origin: string, token: string): string {
	return `${origin}/profesor/verifica?t=${encodeURIComponent(token)}`;
}

function verificationHtml(link: string): string {
	return [
		`<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#22333B">`,
		`<h2 style="color:#2A6F97">Bun venit pe Catedra!</h2>`,
		`<p>Confirmă adresa ta de e-mail apăsând butonul de mai jos:</p>`,
		`<p><a href="${link}" style="display:inline-block;background:#2A6F97;color:#fff;`,
		`text-decoration:none;padding:12px 20px;border-radius:8px">Confirmă adresa</a></p>`,
		`<p style="color:#5C6B73;font-size:13px">Sau copiază linkul în browser:<br>`,
		`<a href="${link}" style="color:#2A6F97">${link}</a></p>`,
		`<p style="color:#5C6B73;font-size:13px">Linkul expiră în 24 de ore. `,
		`Dacă nu tu ai creat acest cont, poți ignora acest mesaj.</p>`,
		`</div>`,
	].join("");
}

/** Send the verification email. Dev (no RESEND_API_KEY): log + return the link so the UI can
 *  show it. Prod: send via Resend. Returns `devLink` only in dev, `error` if Resend rejected.
 *  In production a missing key must never fall back to logging the link: it embeds a live 24h
 *  auth token, and `observability.enabled: true` ships console output to Cloudflare logs. So
 *  prod-without-key returns `error` (surfaced by the resend UI) and logs a token-free notice. */
export async function sendVerificationEmail(
	env: Env,
	to: string,
	link: string,
): Promise<{ devLink?: string; error?: string }> {
	const e = env as unknown as Record<string, string | undefined>;
	const apiKey = e.RESEND_API_KEY;
	if (!apiKey) {
		if (import.meta.env.DEV) {
			console.log(`[dev email] verification link for ${to}: ${link}`);
			return { devLink: link };
		}
		// Production without a key: report the misconfiguration, never the link. The message
		// carries no token — logging `link` here would put a live 24h credential into the
		// Cloudflare logs that `observability.enabled: true` collects.
		console.error("[email] RESEND_API_KEY is not set — verification e-mail not sent.");
		return { error: "email_not_configured" };
	}
	const from = e.EMAIL_FROM ?? "Catedra <onboarding@resend.dev>";
	try {
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				from,
				to,
				subject: "Confirmă-ți adresa de e-mail — Geo-catedra",
				html: verificationHtml(link),
			}),
		});
		if (!res.ok) {
			const detail = await res.text().catch(() => "");
			console.error(`[email] Resend rejected (${res.status}) for ${to}: ${detail}`);
			return { error: `email_send_failed_${res.status}` };
		}
		return {};
	} catch (err) {
		console.error(`[email] Resend request failed for ${to}:`, err);
		return { error: "email_send_error" };
	}
}
