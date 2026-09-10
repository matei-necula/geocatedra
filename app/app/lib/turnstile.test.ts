import { afterEach, describe, expect, it, vi } from "vitest";
import { checkTurnstile, siteverifySucceeded, TURNSTILE_ERROR_MESSAGE, turnstileConfigured, verifyTurnstile } from "./turnstile";

describe("turnstileConfigured", () => {
	it("necesită ambele chei", () => {
		expect(turnstileConfigured({ siteKey: "", secretKey: "" })).toBe(false);
		expect(turnstileConfigured({ siteKey: "a", secretKey: "" })).toBe(false);
		expect(turnstileConfigured({ siteKey: "", secretKey: "b" })).toBe(false);
		expect(turnstileConfigured({ siteKey: "a", secretKey: "b" })).toBe(true);
	});
});

describe("siteverifySucceeded", () => {
	it("acceptă doar success: true", () => {
		expect(siteverifySucceeded({ success: true })).toBe(true);
	});

	it("respinge success: false, indiferent de error-codes", () => {
		expect(siteverifySucceeded({ success: false })).toBe(false);
		expect(siteverifySucceeded({ success: false, "error-codes": ["timeout-or-duplicate"] })).toBe(false);
		expect(siteverifySucceeded({ success: false, "error-codes": ["invalid-input-response"] })).toBe(false);
	});

	it("respinge un răspuns lipsă sau stricat", () => {
		expect(siteverifySucceeded(null)).toBe(false);
		expect(siteverifySucceeded(undefined)).toBe(false);
	});
});

describe("verifyTurnstile", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("respinge fără să apeleze rețeaua când tokenul lipsește", async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
		const ok = await verifyTurnstile("", "secret", "1.2.3.4");
		expect(ok).toBe(false);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("acceptă un token validat de Cloudflare", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
		);
		const ok = await verifyTurnstile("tok", "secret", "1.2.3.4");
		expect(ok).toBe(true);
	});

	it("respinge un token invalid", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), { status: 200 })),
		);
		const ok = await verifyTurnstile("tok", "secret", "1.2.3.4");
		expect(ok).toBe(false);
	});

	it("eșuează închis (fail-closed) la o eroare de rețea", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network down");
			}),
		);
		const ok = await verifyTurnstile("tok", "secret", "1.2.3.4");
		expect(ok).toBe(false);
	});

	it("eșuează închis (fail-closed) la un răspuns HTTP nereușit", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 500 })),
		);
		const ok = await verifyTurnstile("tok", "secret", "1.2.3.4");
		expect(ok).toBe(false);
	});
});

describe("checkTurnstile", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("e no-op (întoarce null) când Turnstile nu e configurat, chiar fără token", async () => {
		const form = new FormData();
		const request = new Request("https://example.com/admin/login", { method: "POST" });
		const error = await checkTurnstile({ siteKey: "", secretKey: "" }, request, form);
		expect(error).toBeNull();
	});

	it("blochează cu mesaj în română când e configurat și tokenul lipsește", async () => {
		const form = new FormData();
		const request = new Request("https://example.com/admin/login", { method: "POST" });
		const error = await checkTurnstile({ siteKey: "site", secretKey: "secret" }, request, form);
		expect(error).toBe(TURNSTILE_ERROR_MESSAGE);
	});

	it("lasă cererea să treacă mai departe când tokenul e validat", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })),
		);
		const form = new FormData();
		form.set("cf-turnstile-response", "tok");
		const request = new Request("https://example.com/admin/login", { method: "POST" });
		const error = await checkTurnstile({ siteKey: "site", secretKey: "secret" }, request, form);
		expect(error).toBeNull();
	});
});
