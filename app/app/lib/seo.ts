// Shared, subject-agnostic SEO meta helper (runbook §4.2). Builds the full react-router
// meta descriptor array — title, description, canonical link, Open Graph, Twitter Card —
// for public pages, or just a robots noindex tag for gated ones.
//
// The production domain isn't bought yet (docs/08-public-launch-runbook.md §1), so this
// file never hardcodes one. Absolute URLs (canonical, og:url, og:image) are built from an
// `origin` the caller derives at request time (`new URL(request.url).origin` in a route
// loader) and threads through as loader data into `meta()`. When a route has no origin to
// give us we fall back to a root-relative URL — legal for <link rel=canonical> and for
// og:url/og:image; browsers and crawlers resolve them against the page's own URL.
import type { MetaDescriptor } from "react-router";
import { subjectConfig } from "../config/subject";
import { BUILD_SITE_MODE } from "./site-mode";

export interface SeoOptions {
	/** Page title. Rendered as `${title} — siteName`. Omit for the site-level default title. */
	title?: string;
	/** Falls back to the subject's tagline when omitted. */
	description?: string;
	/** Root-relative path of the page, e.g. "/confidentialitate". */
	path: string;
	/** Request origin (`new URL(request.url).origin`) when the route's loader provides it. */
	origin?: string;
	/** Root-relative or absolute image URL. Defaults to the shared OG image. */
	image?: string;
	/** Gated/private page: emit only a robots noindex tag — no canonical/og/twitter block. */
	noindex?: boolean;
	type?: "website" | "article";
}

// Previzualizarea din rețelele sociale poartă marca și paleta instanței care o servește —
// la fel ca setul de icoane, ales la construcție (vezi root.tsx). Un link către site-ul liber
// dat pe WhatsApp trebuie să arate cobalt, nu azuriu.
const DEFAULT_IMAGE = BUILD_SITE_MODE === "liber" ? "/og-image-liber.png" : "/og-image.png";

function resolveUrl(pathOrUrl: string, origin?: string): string {
	if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
	return origin ? `${origin}${pathOrUrl}` : pathOrUrl;
}

// og:locale wants language_TERRITORY ("ro_RO"), JSON-LD's inLanguage the BCP47 form ("ro-RO").
// Uppercasing the language code only happens to be right for Romanian — it would emit "en_EN"
// for the additive English locale CLAUDE.md plans for, which is not a real territory. So: a
// locale that already names its region wins, otherwise we look it up, otherwise we admit we
// don't know and the caller omits the tag rather than publishing a wrong one.
const LOCALE_REGIONS: Record<string, string> = { ro: "RO", en: "GB", fr: "FR", de: "DE" };

function localeParts(locale: string): [string, string] | null {
	const [lang, region] = locale.split(/[-_]/);
	const resolved = region?.toUpperCase() ?? LOCALE_REGIONS[lang.toLowerCase()];
	return resolved ? [lang.toLowerCase(), resolved] : null;
}

/** "ro" → "ro_RO" for og:locale. Null when the region is unknown — omit the tag instead. */
function ogLocale(locale: string): string | null {
	const parts = localeParts(locale);
	return parts && `${parts[0]}_${parts[1]}`;
}

/** "ro" → "ro-RO" for JSON-LD `inLanguage`. Falls back to the bare language code, which is
 *  still valid BCP47 — unlike a fabricated region. */
export function bcp47Locale(locale: string): string {
	const parts = localeParts(locale);
	return parts ? `${parts[0]}-${parts[1]}` : locale.toLowerCase();
}

export function seo(opts: SeoOptions): MetaDescriptor[] {
	const { siteName, tagline, defaultLocale } = subjectConfig;
	const title = opts.title ? `${opts.title} — ${siteName}` : `${siteName} — ${tagline}`;
	const description = opts.description ?? tagline;

	if (opts.noindex) {
		return [
			{ title },
			{ name: "description", content: description },
			{ name: "robots", content: "noindex, nofollow" },
		];
	}

	const url = resolveUrl(opts.path, opts.origin);
	const image = resolveUrl(opts.image ?? DEFAULT_IMAGE, opts.origin);
	const locale = ogLocale(defaultLocale);

	return [
		{ title },
		{ name: "description", content: description },
		{ tagName: "link", rel: "canonical", href: url },
		{ property: "og:site_name", content: siteName },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:image", content: image },
		{ property: "og:type", content: opts.type ?? "website" },
		...(locale ? [{ property: "og:locale", content: locale }] : []),
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: image },
	];
}
