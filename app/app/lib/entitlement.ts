// Server-side access control — the anti-piracy floor. Loaders call this BEFORE
// returning any material content. The UI never decides access on its own.

import { inDemoSet } from "./demo";

/** Minimal shape the resolver needs — satisfied by both the DB row and MaterialView. */
export interface AccessibleMaterial {
	id: string;
	status: string;
	library: string;
	gradeId: string;
	slug: string;
	isTeaser: boolean | number;
}

export type Viewer =
	| { role: "admin" }
	| { role: "student"; gradeId: string }
	| { role: "teacher"; hasPedagogy: boolean; subscribed: boolean }
	| { role: "public"; entitled: (id: string) => boolean; subscribed: boolean }
	| { role: "demo" }
	| { role: "liber" }
	| { role: "none" };

export type Visibility = "full" | "view_only" | "preview" | "teaser" | "locked" | "hidden";

export function resolveVisibility(viewer: Viewer, material: AccessibleMaterial): Visibility {
	// Drafts are visible to admin only.
	if (material.status !== "published" && viewer.role !== "admin") return "hidden";

	switch (viewer.role) {
		case "admin":
			return "full";

		case "student":
			// Students only ever see published Student-library materials in THEIR grade.
			if (material.library !== "student") return "hidden";
			if (material.gradeId !== viewer.gradeId) return "hidden";
			return "full";

		case "teacher":
			if (material.library === "teacher" && !viewer.hasPedagogy) return "locked";
			return viewer.subscribed ? "view_only" : "locked";

		case "public":
			if (material.library === "teacher") return "hidden";
			if (material.isTeaser) return "teaser";
			if (viewer.subscribed || viewer.entitled(material.id)) return "full";
			return "locked";

		case "demo":
			// Vizitator anonim pe vitrină. Vede DOAR cele cinci materiale alese în config (al
			// șaselea card de pe /demo e testul, nu un material) — coloana is_teaser nu contează
			// aici, ca să nu existe două surse de adevăr.
			if (!inDemoSet(material.gradeId, material.slug)) return "hidden";
			// Materialele de elevi se văd întregi (asta e proba); teancurile de profesor
			// se văd pe jumătate, cu bugetul impus în loader ȘI în /media/:id.
			return material.library === "teacher" ? "preview" : "full";

		case "liber":
			// Site-ul public și gratuit: tot ce e PUBLICAT, din ambele biblioteci, întreg.
			// Verificarea de ciornă de mai sus se aplică deja tuturor rolurilor, deci ciornele
			// rămân invizibile. Nu se consultă `is_teaser` — pe instanța liberă nu există
			// noțiunea de mostră, totul e deschis.
			return "full";

		default:
			return "hidden";
	}
}

export function canSee(viewer: Viewer, material: AccessibleMaterial): boolean {
	const v = resolveVisibility(viewer, material);
	return v === "full" || v === "view_only" || v === "preview" || v === "teaser";
}
