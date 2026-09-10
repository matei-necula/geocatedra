// Engine types for a subject instance. NOTHING subject-specific lives here —
// only the shape. The geography instance is in ./subject.ts. Swapping subjects
// means swapping that file (+ seed content), never touching engine code.

import type { MotifKey } from "../lib/card-art";

export type Locale = "ro" | "en";

export interface ThemeTokens {
	/** keys map to Tailwind tokens: `primary` -> `bg-primary`, etc. */
	colors: Record<string, string>;
	/** optional dark-mode overrides for the same token keys */
	colorsDark?: Record<string, string>;
	/**
	 * `headingUi` e opțional și există pentru fonturile de titlu cu o singură greutate
	 * (Instrument Serif publică doar 400 și 400 cursiv). Fără el, `h3`/`h4` — care sunt
	 * de 1,05–1,2rem — ar rămâne pe un serif subțire și ierarhia s-ar prăbuși în paginile
	 * lungi de lecție. Temele care nu-l definesc cad pe `heading`, deci e strict aditiv.
	 */
	fonts: { heading: string; body: string; headingUi?: string };
	/** Decorative background motif rendered by the engine; chosen per subject. */
	motif?: "contours" | "none";
}

export interface MaterialTypeDef {
	/** stable key stored on each material row; extensible by adding entries here */
	key: string;
	icon: string;
	/** strings key for the localized label */
	labelKey: string;
	/**
	 * Which generic motif the engine draws on a card that has no image of its own
	 * (see `lib/card-art.ts` for the motif list). The mapping lives here, in config,
	 * so the engine never needs to know what a given subject's material types mean.
	 * Omitted -> the engine falls back to this type's position in the list.
	 */
	art?: MotifKey;
}

export interface TopicDef {
	slug: string;
	label: string;
}

/**
 * A shelf in the teacher library (`library = 'teacher'`).
 *
 * Teacher materials are not organised by the student topics — a lesson plan is
 * not "about" a topic the way a map is — so they carry the collection slug in
 * their `topic_slug` column instead. Adding a shelf is a config edit; no
 * migration and no engine change.
 */
export interface TeacherCollectionDef {
	slug: string;
	/** strings key for the localized label */
	labelKey: string;
	/** strings key for the one-line description shown on the section landing */
	descKey: string;
	/**
	 * strings key for the SINGULAR name of one item on this shelf („Schemă de lecție"), as
	 * opposed to `labelKey`, which names the shelf itself („Scheme de lecție").
	 *
	 * Există pentru `learningResourceType` din JSON-LD, care descrie UN material, nu raftul:
	 * un motor de căutare care citește „Scheme de lecție" pe o pagină cu o singură schemă
	 * primește o afirmație greșită despre ce e pagina. Opțional — un raft care nu-l definește
	 * cade pe `labelKey`, deci adăugarea lui n-a schimbat niciun raft existent.
	 */
	singularKey?: string;
}

/**
 * A node in a concept map (mind map). `label` is the concept; `children` are
 * sub-concepts. The engine renders it generically — the tree content is subject
 * data, so it lives in the instance config, never in engine code.
 */
export interface MindNode {
	label: string;
	children?: MindNode[];
}

export interface GradeDef {
	id: string;
	label: string;
	cycle: string;
	/** strings key for a calm static notice shown wherever this grade is browsed (e.g. "content not published yet"). */
	noticeKey?: string;
}

export interface CycleDef {
	id: string;
	label: string;
	gradeIds: string[];
	/** grouped = one collapsed entry; expanded = each grade shown individually */
	display: "grouped" | "expanded";
}

/** One material put in the public shop window, addressed the way a URL addresses it. */
export interface DemoPick {
	gradeId: string;
	slug: string;
}

/**
 * The public vitrina. Curated here on purpose: two sources of truth for "what is
 * public" means one stray click in admin publishes a material to the open internet.
 * Changing the shop window costs a deploy; it changes about twice a year.
 */
export interface DemoConfig {
	/** Grade whose question bank feeds the demo test. */
	quizGradeId: string;
	/** How many questions the demo test draws. */
	quizLength: number;
	student: DemoPick[];
	teacher: DemoPick[];
}

/**
 * Cine a scris materialele — un om real, cu nume.
 *
 * Există pentru semnalul de Experiență/Expertiză (E-E-A-T): un sit didactic făcut de un singur
 * profesor e evaluat, și de Google și de un cititor, după cine e omul din spate. Numele e un
 * nume propriu, deci NU trece prin `strings`; tot restul sunt chei de traducere, ca orice text
 * de interfață. `subject.config` rămâne singurul loc unde apare identitatea instanței —
 * pagina „Despre autoare" și marcajul `Person` din JSON-LD o citesc de aici amândouă, deci nu
 * pot diverge.
 */
export interface AuthorDef {
	/** Numele real, așa cum se scrie pe pagină și în JSON-LD. */
	name: string;
	/** strings key: rolul într-o linie („profesoară de geografie"). */
	roleKey: string;
	/** strings keys: paragrafele biografice, în ordinea afișării. */
	bioKeys: string[];
	/** strings keys: reperele profesionale, afișate ca listă. */
	credentialKeys: string[];
}

export interface SubjectConfig {
	instanceId: string;
	siteName: string;
	logoText: string;
	tagline: string;
	defaultLocale: Locale;
	locales: Locale[];
	/**
	 * Adresa de contact a operatorului de date (Art. 13 GDPR). Gol până se cumpără domeniul —
	 * paginile legale trebuie să se descurce cinstit cu string-ul gol (fallback la /pareri),
	 * nu să presupună mereu o valoare.
	 */
	contactEmail: string;
	/** Autoarea materialelor. Lipsă → pagina „Despre autoare" și marcajul `Person` se omit
	 *  complet, în loc să afișeze un nume inventat. */
	author?: AuthorDef;
	theme: ThemeTokens;
	/** Tema instanței libere. Lipsă → se folosește `theme`. Redesignul vizual e etapă separată. */
	themeLiber?: ThemeTokens;
	cycles: CycleDef[];
	grades: GradeDef[];
	/** topics keyed by gradeId */
	topics: Record<string, TopicDef[]>;
	materialTypes: MaterialTypeDef[];
	/** shelves of the teacher (pedagogy) library */
	teacherCollections: TeacherCollectionDef[];
	demo: DemoConfig;
	/** concept maps keyed by `${gradeId}:${topicSlug}` (optional per topic) */
	mindmaps?: Record<string, MindNode>;
	strings: Record<string, string>;
}
