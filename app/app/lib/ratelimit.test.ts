import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clientIp,
	missingLimiters,
	RATE_LIMITERS,
	resetLimiterWarning,
	underLimit,
	warnMissingLimiters,
} from "./ratelimit";

const ok = { limit: async () => ({ success: true }) };
const blocked = { limit: async () => ({ success: false }) };

/** Un env cu toate cele cinci limitatoare prezente. */
function fullEnv(): Record<string, unknown> {
	return Object.fromEntries(RATE_LIMITERS.map((n) => [n, ok]));
}

beforeEach(() => resetLimiterWarning());

describe("clientIp", () => {
	it("citește CF-Connecting-IP, altfel 'unknown'", () => {
		expect(clientIp(new Request("https://x/", { headers: { "CF-Connecting-IP": "1.2.3.4" } }))).toBe("1.2.3.4");
		expect(clientIp(new Request("https://x/"))).toBe("unknown");
	});
});

describe("missingLimiters", () => {
	it("nu raportează nimic când toate cele cinci sunt legate", () => {
		expect(missingLimiters(fullEnv())).toEqual([]);
	});

	it("prinde forma greșită din wrangler.json (Unsafe Metadata → nu e obiect RateLimit)", () => {
		// Așa arăta env-ul cât timp limitatoarele stăteau în `unsafe.bindings`: cheia lipsește
		// de tot, sau vine ca metadata simplă, fără metoda limit().
		const env = { ...fullEnv(), LOGIN_LIMITER: { namespace_id: "1001" } };
		expect(missingLimiters(env)).toEqual(["LOGIN_LIMITER"]);
	});

	it("le enumeră pe toate când env-ul e gol", () => {
		expect(missingLimiters({})).toEqual([...RATE_LIMITERS]);
		expect(missingLimiters(undefined)).toEqual([...RATE_LIMITERS]);
	});
});

describe("warnMissingLimiters", () => {
	it("tace când totul e legat", () => {
		const log = vi.fn();
		warnMissingLimiters(fullEnv(), log);
		expect(log).not.toHaveBeenCalled();
	});

	it("numește fiecare binding lipsă", () => {
		const log = vi.fn();
		warnMissingLimiters({ ...fullEnv(), DEMO_LIMITER: undefined, NICK_LIMITER: undefined }, log);
		expect(log).toHaveBeenCalledTimes(1);
		expect(log.mock.calls[0][0]).toContain("DEMO_LIMITER");
		expect(log.mock.calls[0][0]).toContain("NICK_LIMITER");
		expect(log.mock.calls[0][0]).not.toContain("LOGIN_LIMITER");
	});

	it("scrie o singură dată per izolat, ca să nu inunde logurile", () => {
		const log = vi.fn();
		warnMissingLimiters({}, log);
		warnMissingLimiters({}, log);
		warnMissingLimiters({}, log);
		expect(log).toHaveBeenCalledTimes(1);
	});
});

describe("underLimit", () => {
	it("lasă să treacă sub limită și blochează peste", async () => {
		await expect(underLimit(fullEnv() as never, "LOGIN_LIMITER", "k")).resolves.toBe(true);
		const strict = { ...fullEnv(), LOGIN_LIMITER: blocked };
		await expect(underLimit(strict as never, "LOGIN_LIMITER", "k")).resolves.toBe(false);
	});

	it("cade deschis dacă binding-ul lipsește — dar avertizează", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await expect(underLimit({} as never, "LOGIN_LIMITER", "k")).resolves.toBe(true);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain("LOGIN_LIMITER");
		warn.mockRestore();
	});

	it("cade deschis dacă limit() aruncă", async () => {
		const env = {
			...fullEnv(),
			LOGIN_LIMITER: {
				limit: async () => {
					throw new Error("boom");
				},
			},
		};
		await expect(underLimit(env as never, "LOGIN_LIMITER", "k")).resolves.toBe(true);
	});
});
