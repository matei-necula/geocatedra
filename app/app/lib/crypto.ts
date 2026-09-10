// Web Crypto helpers — run on Cloudflare Workers (no Node crypto).
// Used for: hashing class tokens at rest, and HMAC-signing session cookies.

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Normalize a class token before hashing/comparison (case/space-insensitive). */
export function normalizeToken(raw: string): string {
	return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Tokens are stored only as a hash — never in plaintext. */
export async function hashToken(raw: string): Promise<string> {
	return sha256Hex(normalizeToken(raw));
}

function b64urlEncode(bytes: Uint8Array): string {
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
	let s = str.replace(/-/g, "+").replace(/_/g, "/");
	while (s.length % 4) s += "=";
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function hmacKey(secret: string) {
	return crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

/** Sign a small JSON payload -> `body.signature` (both base64url). */
export async function signPayload(payload: unknown, secret: string): Promise<string> {
	const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
	const key = await hmacKey(secret);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
	return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** Verify + parse a signed payload. Returns null if tampered/invalid. */
export async function verifyPayload<T>(token: string, secret: string): Promise<T | null> {
	const dot = token.indexOf(".");
	if (dot < 0) return null;
	const body = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const key = await hmacKey(secret);
	let ok = false;
	try {
		ok = await crypto.subtle.verify(
			"HMAC",
			key,
			b64urlDecode(sig) as BufferSource,
			enc.encode(body) as BufferSource,
		);
	} catch {
		return null;
	}
	if (!ok) return null;
	try {
		return JSON.parse(dec.decode(b64urlDecode(body))) as T;
	} catch {
		return null;
	}
}

/** Human-friendly random code (no easily-confused characters). */
export function randomCode(len = 4): string {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const arr = new Uint8Array(len);
	crypto.getRandomValues(arr);
	return [...arr].map((b) => alphabet[b % alphabet.length]).join("");
}

export function randomId(): string {
	return crypto.randomUUID();
}

/** Constant-time string comparison (avoids leaking the secret via response timing). */
export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
