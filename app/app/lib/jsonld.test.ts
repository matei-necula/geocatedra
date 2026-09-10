import { describe, expect, it } from "vitest";
import {
	absUrl,
	aboutPageJsonLd,
	breadcrumbJsonLd,
	educationalLevelLabel,
	faqPageJsonLd,
	ldJson,
	learningResourceJsonLd,
	organizationJsonLd,
	personJsonLd,
	websiteJsonLd,
} from "./jsonld";
import { subjectConfig } from "../config/subject";

type Loose = Record<string, unknown>;

const ORIGIN = "https://exemplu.test";

describe("absUrl", () => {
	it("prefixes a root-relative path with the origin", () => {
		expect(absUrl("/despre", ORIGIN)).toBe(`${ORIGIN}/despre`);
	});

	// Aceeași alegere ca în lib/seo.ts: fără `origin` lăsăm calea relativă, care e legală în
	// JSON-LD (se rezolvă față de URL-ul paginii). Un domeniu inventat n-ar fi.
	it("leaves the path relative when no origin is known", () => {
		expect(absUrl("/despre")).toBe("/despre");
	});

	it("passes an already-absolute URL through untouched", () => {
		expect(absUrl("https://alt.example/x", ORIGIN)).toBe("https://alt.example/x");
	});
});

describe("ldJson", () => {
	it("wraps each object in a react-router `script:ld+json` descriptor", () => {
		const out = ldJson({ "@type": "Thing" }, { "@type": "Person" });
		expect(out).toHaveLength(2);
		expect((out[0] as Loose)["script:ld+json"]).toEqual({ "@type": "Thing" });
	});

	// Apelanții scriu condiții inline (`breadcrumbJsonLd(...)` întoarce null pentru o singură
	// firimitură). Dacă `ldJson` n-ar filtra, ar ajunge un `<script>` cu „null" în <head>.
	it("skips null and undefined so callers can pass conditional builders inline", () => {
		expect(ldJson(null, { "@type": "Thing" }, undefined)).toHaveLength(1);
	});
});

describe("breadcrumbJsonLd", () => {
	it("numbers positions from 1 and keeps the given order", () => {
		const ld = breadcrumbJsonLd(
			[
				{ label: "Acasă", to: "/" },
				{ label: "Elevi", to: "/elevi" },
				{ label: "Hidrosfera" },
			],
			ORIGIN,
		);
		const items = ld?.itemListElement as Loose[];
		expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
		expect(items[1].item).toBe(`${ORIGIN}/elevi`);
	});

	// Ultima firimitură e pagina curentă: `<Breadcrumbs>` o randează ca text, nu ca link, deci
	// marcajul n-are voie să inventeze un `item` pentru ea. Marcajul trebuie să spună exact ce
	// vede omul — altfel Google retrage rezultatul bogat.
	it("omits `item` for a crumb without a path, matching the visible nav", () => {
		const ld = breadcrumbJsonLd([{ label: "Acasă", to: "/" }, { label: "Hidrosfera" }], ORIGIN);
		const items = ld?.itemListElement as Loose[];
		expect(items[1]).not.toHaveProperty("item");
	});

	// O singură treaptă nu e un drum. Un BreadcrumbList cu un element e zgomot, nu structură.
	it("returns null for fewer than two crumbs", () => {
		expect(breadcrumbJsonLd([{ label: "Acasă", to: "/" }], ORIGIN)).toBeNull();
	});
});

describe("learningResourceJsonLd", () => {
	const base = { name: "Hidrosfera", path: "/elevi/9/m/hidrosfera", origin: ORIGIN };

	it("declares the type, the language and free access", () => {
		const ld = learningResourceJsonLd(base);
		expect(ld["@type"]).toBe("LearningResource");
		expect(ld.url).toBe(`${ORIGIN}/elevi/9/m/hidrosfera`);
		expect(ld.inLanguage).toBe("ro-RO");
		// Adevărat fiindcă marcajul se emite doar de pe rutele instanței libere (app/routes.ts).
		expect(ld.isAccessibleForFree).toBe(true);
	});

	// Un câmp gol spune motorului că pagina chiar n-are descriere — mai rău decât să lipsească.
	it("drops empty and missing fields instead of emitting them blank", () => {
		const ld = learningResourceJsonLd({ ...base, description: "", about: undefined });
		expect(ld).not.toHaveProperty("description");
		expect(ld).not.toHaveProperty("about");
		expect(ld).not.toHaveProperty("educationalLevel");
	});

	it("wraps the audience role in an EducationalAudience node", () => {
		const ld = learningResourceJsonLd({ ...base, audienceRole: "teacher" });
		expect(ld.audience).toEqual({ "@type": "EducationalAudience", educationalRole: "teacher" });
	});

	it("links the shelf it belongs to as a Collection with its own URL", () => {
		const ld = learningResourceJsonLd({
			...base,
			partOfName: "Scheme de lecție",
			partOfPath: "/pedagogie/scheme-de-lectie",
		});
		expect(ld.isPartOf).toEqual({
			"@type": "Collection",
			name: "Scheme de lecție",
			url: `${ORIGIN}/pedagogie/scheme-de-lectie`,
		});
	});

	it("always names the provider, so every resource is attributable to the site", () => {
		const ld = learningResourceJsonLd(base);
		expect((ld.provider as Loose).name).toBe(subjectConfig.siteName);
	});
});

describe("faqPageJsonLd", () => {
	it("turns each pair into a Question with its accepted answer", () => {
		const ld = faqPageJsonLd([{ q: "E gratuit?", a: "Da." }], "/intrebari-frecvente", ORIGIN);
		const entities = ld?.mainEntity as Loose[];
		expect(entities).toHaveLength(1);
		expect(entities[0].name).toBe("E gratuit?");
		expect(entities[0].acceptedAnswer).toEqual({ "@type": "Answer", text: "Da." });
	});

	it("returns null for an empty list rather than an empty FAQPage", () => {
		expect(faqPageJsonLd([], "/intrebari-frecvente", ORIGIN)).toBeNull();
	});
});

describe("organization / website / person", () => {
	it("names the site, not the person, as the organization", () => {
		const ld = organizationJsonLd(ORIGIN);
		expect(ld["@type"]).toBe("EducationalOrganization");
		expect(ld.name).toBe(subjectConfig.siteName);
		expect(ld.url).toBe(`${ORIGIN}/`);
	});

	it("publishes the website under the same organization", () => {
		const ld = websiteJsonLd(ORIGIN);
		expect((ld.publisher as Loose).name).toBe(subjectConfig.siteName);
	});

	// `author` e opțional în SubjectConfig: o instanță fără autoare declarată nu trebuie să
	// publice un nod `Person` gol, ci niciunul.
	it("omits the Person node entirely when the instance declares no author", () => {
		const author = subjectConfig.author;
		try {
			(subjectConfig as { author?: unknown }).author = undefined;
			expect(personJsonLd(ORIGIN)).toBeNull();
			expect(aboutPageJsonLd("/despre", ORIGIN)).toBeNull();
			expect(organizationJsonLd(ORIGIN)).not.toHaveProperty("founder");
		} finally {
			(subjectConfig as { author?: unknown }).author = author;
		}
	});

	it("points the author at the page that actually describes her", () => {
		expect(personJsonLd(ORIGIN)?.url).toBe(`${ORIGIN}/despre`);
	});
});

describe("educationalLevelLabel", () => {
	// Programele școlare scriu clasa cu cifre romane; site-ul o scrie cu arabe, fiindcă e mai
	// ușor de citit de un elev. `educationalLevel` e citit de motoare, deci acolo se dă forma
	// oficială — fără să atingem eticheta vizibilă.
	it("converts the site's arabic grade label to the curriculum's roman form", () => {
		expect(educationalLevelLabel("Clasa a 9-a")).toBe("Clasa a IX-a");
		expect(educationalLevelLabel("Clasa a 12-a")).toBe("Clasa a XII-a");
	});

	it("leaves a label it does not recognise exactly as it is", () => {
		expect(educationalLevelLabel("Gimnaziu")).toBe("Gimnaziu");
		expect(educationalLevelLabel("Clasa a 13-a")).toBe("Clasa a 13-a");
	});
});
