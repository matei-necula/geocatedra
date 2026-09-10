import type { Route } from "./+types/sitemap[.]xml";
import type { SitemapEntry } from "../lib/sitemap";
import { buildLiberSitemapEntries, buildSitemapXml, LEGAL_PATHS } from "../lib/sitemap";
import { gradeById, subjectConfig } from "../config/subject";
import { BUILD_SITE_MODE } from "../lib/site-mode";
import { getDb } from "../db/client";
import { listMaterialsForGrade, listTeacherCollection } from "../lib/content";
import { countPublished } from "../lib/questions";

// Materialele din vitrină (lib/demo.ts + subject.config) sunt singurele accesibile unui
// vizitator anonim: routes/demo.* construiesc vizitatorul `demo`, iar podeaua din
// lib/entitlement.ts le lasă să treacă. Sunt marketing, deci le vrem indexate.
// Tot restul — /clasa/*, /profesor/*, /admin/* — rămâne în afara sitemap-ului.
const STATIC_PATHS = ["/", "/demo", "/demo/exerseaza", ...LEGAL_PATHS];

// /info/teachers e singurul placeholder rămas; /info/public redirecționează spre /demo.
const INFO_ROLES = ["teachers"];

async function buildClaseEntries(): Promise<SitemapEntry[]> {
	return [
		...STATIC_PATHS.map((path) => ({
			path,
			changefreq: "monthly" as const,
			priority: path === "/" ? 1 : path === "/demo" ? 0.9 : 0.5,
		})),
		...INFO_ROLES.map((role) => ({ path: `/info/${role}`, changefreq: "monthly" as const, priority: 0.3 })),
		...[...subjectConfig.demo.student, ...subjectConfig.demo.teacher].map((p) => ({
			path: `/demo/m/${p.gradeId}/${p.slug}`,
			changefreq: "monthly" as const,
			priority: 0.6,
		})),
	];
}

// Toate interogările D1 stau aici, în rută — lib/sitemap.ts rămâne pur (fără DB, fără request),
// deci `buildLiberSitemapEntries` e testabilă direct cu date de test (vezi sitemap.test.ts).
// `includeUnpublished` rămâne implicit false peste tot: ciornele nu ies pe internet, la fel ca
// pe paginile /elevi și /pedagogie/:raft pe care le rulează pe aceleași funcții.
async function fetchLiberEntries(env: Env): Promise<SitemapEntry[]> {
	const db = getDb(env);
	const locale = subjectConfig.defaultLocale;

	const studentMaterialLists = await Promise.all(
		subjectConfig.grades.map((grade) => listMaterialsForGrade(db, grade.id, locale, "student", false)),
	);
	const teacherMaterialLists = await Promise.all(
		subjectConfig.teacherCollections.map((c) => listTeacherCollection(db, c.slug, locale, false)),
	);

	// O clasă intră la /exerseaza doar dacă are măcar o întrebare publicată — altfel ruta există,
	// dar formularul arată mesajul "practice.empty" (vezi liber.exerseaza.tsx), ceea ce n-are ce
	// căuta indexat. `countPublished(db, gradeId, null)` numără pe toată clasa, ca la afișarea
	// "toată clasa" din formular.
	const practiceCounts = await Promise.all(
		subjectConfig.grades.map((grade) => countPublished(db, grade.id, null)),
	);
	const practiceGrades = subjectConfig.grades
		.filter((_, i) => practiceCounts[i] > 0)
		.map((grade) => ({ gradeId: grade.id }));

	// O hartă conceptuală "există" exact în condiția din liber.harta.tsx: o intrare în
	// subjectConfig.mindmaps la cheia "gradeId:topicSlug" (altfel loaderul aruncă 404). Cheile
	// sunt deja în acea formă, deci enumerarea lor e sursa de adevăr — nicio interogare D1 aici,
	// hărțile mintale sunt conținut de configurare, nu materiale din bază.
	const conceptMaps = Object.keys(subjectConfig.mindmaps ?? {})
		.map((key) => {
			const [gradeId, topicSlug] = key.split(":");
			return { gradeId, topicSlug };
		})
		.filter((m) => gradeById(m.gradeId));

	return buildLiberSitemapEntries({
		studentMaterials: studentMaterialLists.flat(),
		practiceGrades,
		conceptMaps,
		teacherCollections: subjectConfig.teacherCollections,
		teacherMaterials: teacherMaterialLists.flat(),
	});
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const origin = new URL(request.url).origin;

	const entries =
		BUILD_SITE_MODE === "liber"
			? await fetchLiberEntries(context.cloudflare.env)
			: await buildClaseEntries();

	const xml = buildSitemapXml({ origin, entries });

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
