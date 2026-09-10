import { describe, expect, it } from "vitest";
import { seo, bcp47Locale } from "./seo";
import { subjectConfig } from "../config/subject";

type Loose = Record<string, unknown>;

// Pull descriptors by key regardless of shape ({name,content} / {property,content} / {title} / link).
function findByName(list: ReturnType<typeof seo>, name: string) {
	return (list as Loose[]).find((d) => d.name === name) as { content: string } | undefined;
}
function findByProperty(list: ReturnType<typeof seo>, property: string) {
	return (list as Loose[]).find((d) => d.property === property) as { content: string } | undefined;
}
function findTitle(list: ReturnType<typeof seo>) {
	return (list as Loose[]).find((d) => "title" in d) as { title: string } | undefined;
}
function findCanonical(list: ReturnType<typeof seo>) {
	return (list as Loose[]).find((d) => d.rel === "canonical") as { href: string } | undefined;
}

describe("seo", () => {
	it("composes the title as `title — siteName` when a title is given", () => {
		const list = seo({ title: "Materiale", path: "/admin/materiale" });
		expect(findTitle(list)?.title).toBe(`Materiale — ${subjectConfig.siteName}`);
	});

	it("falls back to `siteName — tagline` when no title is given", () => {
		const list = seo({ path: "/" });
		expect(findTitle(list)?.title).toBe(`${subjectConfig.siteName} — ${subjectConfig.tagline}`);
	});

	it("falls back to the tagline when no description is given", () => {
		const list = seo({ path: "/" });
		expect(findByName(list, "description")?.content).toBe(subjectConfig.tagline);
	});

	it("noindex emits only title, description and a robots tag — no og/twitter/canonical", () => {
		const list = seo({ title: "Admin", path: "/admin", noindex: true });
		expect(findByName(list, "robots")?.content).toBe("noindex, nofollow");
		expect(findCanonical(list)).toBeUndefined();
		expect(findByProperty(list, "og:title")).toBeUndefined();
		expect(findByName(list, "twitter:card")).toBeUndefined();
		expect(findTitle(list)?.title).toBe(`Admin — ${subjectConfig.siteName}`);
	});

	it("builds a root-relative canonical/og:url/og:image when no origin is given", () => {
		const list = seo({ path: "/confidentialitate" });
		expect(findCanonical(list)?.href).toBe("/confidentialitate");
		expect(findByProperty(list, "og:url")?.content).toBe("/confidentialitate");
		expect(findByProperty(list, "og:image")?.content).toBe("/og-image.png");
	});

	it("builds absolute canonical/og:url/og:image when an origin is given", () => {
		const list = seo({ path: "/confidentialitate", origin: "https://example.workers.dev" });
		expect(findCanonical(list)?.href).toBe("https://example.workers.dev/confidentialitate");
		expect(findByProperty(list, "og:url")?.content).toBe(
			"https://example.workers.dev/confidentialitate",
		);
		expect(findByProperty(list, "og:image")?.content).toBe(
			"https://example.workers.dev/og-image.png",
		);
	});

	it("leaves an already-absolute image URL untouched even with an origin", () => {
		const list = seo({
			path: "/",
			origin: "https://example.workers.dev",
			image: "https://cdn.example.com/pic.png",
		});
		expect(findByProperty(list, "og:image")?.content).toBe("https://cdn.example.com/pic.png");
	});

	it("sets og:locale to ro_RO for the ro locale", () => {
		const list = seo({ path: "/" });
		expect(findByProperty(list, "og:locale")?.content).toBe("ro_RO");
	});

	it("sets twitter:card to summary_large_image", () => {
		const list = seo({ path: "/" });
		expect(findByName(list, "twitter:card")?.content).toBe("summary_large_image");
	});

	it("defaults og:type to website and allows overriding it", () => {
		const list = seo({ path: "/" });
		expect(findByProperty(list, "og:type")?.content).toBe("website");
		const article = seo({ path: "/", type: "article" });
		expect(findByProperty(list, "og:type")?.content).not.toBe(undefined);
		expect(findByProperty(article, "og:type")?.content).toBe("article");
	});

	it("never emits a descriptor with undefined content", () => {
		for (const list of [
			seo({ path: "/" }),
			seo({ path: "/admin", noindex: true }),
			seo({ path: "/x", title: "T", description: "D", origin: "https://a.b" }),
		]) {
			for (const d of list) {
				if ("content" in d) expect((d as { content: unknown }).content).not.toBeUndefined();
				if ("href" in d) expect((d as { href: unknown }).href).not.toBeUndefined();
				if ("title" in d) expect((d as { title: unknown }).title).not.toBeUndefined();
			}
		}
	});
});

describe("bcp47Locale", () => {
	it("expands a known bare language code to its region", () => {
		expect(bcp47Locale("ro")).toBe("ro-RO");
	});

	it("keeps a region the locale already names, normalising case", () => {
		expect(bcp47Locale("ro-md")).toBe("ro-MD");
		expect(bcp47Locale("en_US")).toBe("en-US");
	});

	// The bug this guards: uppercasing the language code invents territories that don't exist
	// ("en" → "en_EN"). A bare language tag is valid BCP47; a fabricated region is not.
	it("falls back to the bare language rather than inventing a region", () => {
		expect(bcp47Locale("zz")).toBe("zz");
	});
});
