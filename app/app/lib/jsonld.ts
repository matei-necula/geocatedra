// Date structurate (JSON-LD, schema.org) — pure, fără DB și fără request.
//
// De ce trăiesc aici și nu în componente: React Router v7 acceptă descriptorul
// `{ "script:ld+json": obiect }` direct din `meta()`, deci marcajul ajunge în `<head>`, lângă
// `<title>` și canonic, construit din ACELEAȘI date pe care le primește `seo()`. Un `<script>`
// scris de mână în corpul paginii ar fi fost a doua sursă de adevăr pentru titlu și descriere,
// iar cele două ar fi divergat la prima editare.
//
// Regula de fond, moștenită din `lib/seo.ts`: **nimic nu se inventează**. Un câmp pe care nu-l
// putem umple cinstit se omite — un `datePublished` fabricat sau un `aggregateRating` fără
// recenzii reale sunt exact felul de marcaj pentru care Google retrage rezultatele bogate.
//
// Domeniul NU se scrie niciodată aici: URL-urile absolute se construiesc dintr-un `origin`
// pe care ruta îl ia din cerere (`new URL(request.url).origin`), la fel ca în `lib/seo.ts`.
import type { MetaDescriptor } from "react-router";
import { subjectConfig } from "../config/subject";
import { bcp47Locale } from "./seo";

/** Un obiect JSON-LD oarecare. Structura o dă apelantul; aici ne interesează doar că e serializabil. */
export type LdObject = Record<string, unknown>;

/** Absolutizează o cale root-relativă când avem `origin`; altfel o lasă așa cum e.
 *  O cale relativă e legală în JSON-LD (se rezolvă față de URL-ul paginii) — un domeniu
 *  inventat nu ar fi. */
export function absUrl(path: string, origin?: string): string {
	if (/^https?:\/\//i.test(path)) return path;
	return origin ? `${origin}${path}` : path;
}

/** Împachetează unul sau mai multe obiecte JSON-LD în descriptori `meta()` de React Router.
 *  Valorile `null`/`undefined` se sar, ca apelantul să poată scrie condiții inline. */
export function ldJson(...objects: (LdObject | null | undefined)[]): MetaDescriptor[] {
	return objects.filter((o): o is LdObject => Boolean(o)).map((o) => ({ "script:ld+json": o }) as MetaDescriptor);
}

/** Elimină cheile fără valoare, recursiv la primul nivel. Un câmp gol e mai rău decât absent:
 *  `"description": ""` spune motorului că pagina chiar n-are descriere. */
function compact(obj: Record<string, unknown>): LdObject {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v === undefined || v === null || v === "") continue;
		if (Array.isArray(v) && v.length === 0) continue;
		out[k] = v;
	}
	return out;
}

/** Autoarea, ca `Person`. E cel mai puternic semnal de Experiență/Expertiză pe care îl are un
 *  sit făcut de un singur om — dar numai dacă numele din marcaj e chiar cel de pe pagina
 *  „Despre autoare", deci amândouă îl citesc din config. */
export function personJsonLd(origin?: string): LdObject | null {
	const author = subjectConfig.author;
	if (!author) return null;
	return compact({
		"@type": "Person",
		name: author.name,
		jobTitle: subjectConfig.strings[author.roleKey] ?? undefined,
		url: absUrl("/despre", origin),
	});
}

/** Organizația care publică — numele sitului, nu al persoanei. Perechea `provider` a
 *  materialelor și entitatea de rădăcină pentru Knowledge Graph. */
export function organizationJsonLd(origin?: string): LdObject {
	return compact({
		"@context": "https://schema.org",
		"@type": "EducationalOrganization",
		name: subjectConfig.siteName,
		url: absUrl("/", origin),
		description: subjectConfig.tagline,
		inLanguage: bcp47Locale(subjectConfig.defaultLocale),
		email: subjectConfig.contactEmail || undefined,
		founder: personJsonLd(origin) ?? undefined,
	});
}

/** Aceeași organizație, dar fără `@context` — pentru încorporare ca `provider` într-un alt nod. */
function providerNode(origin?: string): LdObject {
	return compact({
		"@type": "EducationalOrganization",
		name: subjectConfig.siteName,
		url: absUrl("/", origin),
	});
}

export function websiteJsonLd(origin?: string): LdObject {
	return compact({
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: subjectConfig.siteName,
		url: absUrl("/", origin),
		description: subjectConfig.tagline,
		inLanguage: bcp47Locale(subjectConfig.defaultLocale),
		publisher: providerNode(origin),
	});
}

export interface CrumbRef {
	/** Textul vizibil al firimiturii. */
	label: string;
	/** Calea root-relativă. Ultima firimitură (pagina curentă) o poate omite. */
	to?: string;
}

/** `BreadcrumbList` construit din ACELEAȘI firimituri pe care le randează `<Breadcrumbs>`.
 *  Google cere ca marcajul să corespundă cu ce vede utilizatorul; o singură sursă e singurul
 *  fel în care rămâne adevărat după următoarea editare. */
export function breadcrumbJsonLd(items: CrumbRef[], origin?: string): LdObject | null {
	if (items.length < 2) return null;
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((c, i) =>
			compact({
				"@type": "ListItem",
				position: i + 1,
				name: c.label,
				item: c.to ? absUrl(c.to, origin) : undefined,
			}),
		),
	};
}

export interface LearningResourceInput {
	name: string;
	description?: string;
	/** Calea root-relativă a paginii. */
	path: string;
	origin?: string;
	/** Ce fel de resursă e, în cuvintele materiei: „Lecție", „Schemă de lecție", „Joc interactiv". */
	learningResourceType?: string;
	/** Nivelul, în forma pe care o folosește chiar situl: „Clasa a IX-a". */
	educationalLevel?: string;
	/** „student" sau „teacher" (schema.org: `educationalRole`). */
	audienceRole?: "student" | "teacher";
	/** Subiectul lecției — de obicei capitolul din programă. */
	about?: string;
	/** Raftul/capitolul din care face parte, ca nume de colecție. */
	partOfName?: string;
	partOfPath?: string;
	/** „active" pentru jocuri și teste, „expositive" pentru lecții citite. */
	interactivityType?: "active" | "expositive" | "mixed";
	/** URL root-relativ al unei imagini reprezentative (de obicei `/media/:id?t`). */
	image?: string;
}

/**
 * `LearningResource` — nodul potrivit pentru orice pagină de material, de elev sau de profesor.
 *
 * `isAccessibleForFree` e scris ca `true` fiindcă marcajul se emite DOAR de pe rutele instanței
 * libere, unde chiar e adevărat (vezi `app/routes.ts`, `liberOnly`). Pe instanța cu clase rutele
 * astea nu există în bundle, deci nu există nici riscul de a declara gratuit ceva ce e închis.
 */
export function learningResourceJsonLd(input: LearningResourceInput): LdObject {
	const { origin } = input;
	return compact({
		"@context": "https://schema.org",
		"@type": "LearningResource",
		name: input.name,
		description: input.description,
		url: absUrl(input.path, origin),
		learningResourceType: input.learningResourceType,
		educationalLevel: input.educationalLevel,
		interactivityType: input.interactivityType,
		inLanguage: bcp47Locale(subjectConfig.defaultLocale),
		isAccessibleForFree: true,
		image: input.image ? absUrl(input.image, origin) : undefined,
		audience: input.audienceRole
			? { "@type": "EducationalAudience", educationalRole: input.audienceRole }
			: undefined,
		about: input.about ? { "@type": "Thing", name: input.about } : undefined,
		isPartOf: input.partOfName
			? compact({
					"@type": "Collection",
					name: input.partOfName,
					url: input.partOfPath ? absUrl(input.partOfPath, origin) : undefined,
				})
			: undefined,
		provider: providerNode(origin),
		author: personJsonLd(origin) ?? undefined,
	});
}

export interface FaqItem {
	q: string;
	a: string;
}

/**
 * `FAQPage`. Se construiește din ACELAȘI tablou care randează lista vizibilă — marcajul care
 * nu se regăsește pe pagină e o încălcare directă a regulilor Google pentru rezultate bogate,
 * iar două liste scrise separat diverg la prima corectură.
 */
export function faqPageJsonLd(items: FaqItem[], path: string, origin?: string): LdObject | null {
	if (items.length === 0) return null;
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		url: absUrl(path, origin),
		inLanguage: bcp47Locale(subjectConfig.defaultLocale),
		mainEntity: items.map((it) => ({
			"@type": "Question",
			name: it.q,
			acceptedAnswer: { "@type": "Answer", text: it.a },
		})),
	};
}

/**
 * Pagina „Despre autoare", ca `AboutPage` cu entitatea principală `Person`.
 *
 * Nu emitem niciodată marcaj de `Question`/`acceptedAnswer` pentru testele grilă (vezi
 * `docs/09-seo-strategy.md`): răspunsul corect nu ajunge niciodată la client
 * (`lib/questions.ts`), iar un marcaj cu răspunsuri l-ar scurge chiar în sursa paginii.
 */
export function aboutPageJsonLd(path: string, origin?: string): LdObject | null {
	const person = personJsonLd(origin);
	if (!person) return null;
	return {
		"@context": "https://schema.org",
		"@type": "AboutPage",
		url: absUrl(path, origin),
		inLanguage: bcp47Locale(subjectConfig.defaultLocale),
		mainEntity: person,
	};
}

/** Numeralul roman al clasei, pentru `educationalLevel` („Clasa a IX-a" în loc de „Clasa a 9-a").
 *  Formularea românească a nivelului e conținut de materie, deci vine din eticheta clasei;
 *  aici doar preferăm forma pe care o folosesc programele școlare. */
export function educationalLevelLabel(gradeLabel: string): string {
	const ROMAN: Record<string, string> = {
		"5": "V", "6": "VI", "7": "VII", "8": "VIII",
		"9": "IX", "10": "X", "11": "XI", "12": "XII",
	};
	return gradeLabel.replace(/\b(\d{1,2})-a\b/, (m, d: string) => (ROMAN[d] ? `${ROMAN[d]}-a` : m));
}
