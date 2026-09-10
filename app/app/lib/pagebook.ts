// Materialele răsfoibile (schițe de lecție, ghiduri metodologice) sunt un teanc de
// pagini-imagine: body-ul e {"kind":"pagini","count":N}, iar paginile propriu-zise
// sunt assets cu idx 0..N-1. Discriminatorul `kind` urmează tiparul de la jocuri.

/** Zonă din pagină pe care se poate da clic, ducând la alt material din
 *  aceeași colecție. Coordonatele sunt în procente din imaginea paginii, iar
 *  `page` e numărul paginii așa cum îl vede omul (1 = prima). */
export interface PageLink {
	page: number;
	x: number;
	y: number;
	w: number;
	h: number;
	/** slug-ul materialului-țintă, frate în aceeași rută */
	slug: string;
	/** text pentru cititorul de ecran */
	label?: string;
}

export interface PageBook {
	count: number;
	links?: PageLink[];
}

/**
 * Întoarce cartea dacă body-ul o descrie și există pagini, altfel `null` — apelantul
 * cade atunci pe randarea veche, ca să nu rămână pagina goală la un body stricat.
 */
export function parsePageBook(body: string, assetCount: number): PageBook | null {
	let data: unknown;
	try {
		data = JSON.parse(body);
	} catch {
		return null;
	}
	if (!data || typeof data !== "object") return null;
	const d = data as Record<string, unknown>;
	if (d.kind !== "pagini") return null;

	// Assets-urile sunt adevărul: nu putem arăta mai multe pagini decât imagini avem.
	const declared = typeof d.count === "number" && Number.isFinite(d.count) ? Math.floor(d.count) : 0;
	const count = declared > 0 ? Math.min(declared, assetCount) : assetCount;
	if (count <= 0) return null;

	// `links` (opțional): zone de clic. Se aruncă întreg dacă nu e o listă de
	// dreptunghiuri valide, ca un body stricat să nu lase pagina cu zone moarte.
	let links: PageLink[] | undefined;
	if (Array.isArray(d.links)) {
		const ok = d.links.every((l) => {
			if (!l || typeof l !== "object") return false;
			const v = l as Record<string, unknown>;
			const nums = ["page", "x", "y", "w", "h"].every(
				(k) => typeof v[k] === "number" && Number.isFinite(v[k] as number),
			);
			return nums && typeof v.slug === "string" && v.slug !== "";
		});
		if (ok) {
			const inside = (d.links as PageLink[]).filter(
				(l) => l.page >= 1 && l.page <= count && l.w > 0 && l.h > 0,
			);
			if (inside.length) links = inside;
		}
	}
	return { count, links };
}

/**
 * Ce pagină se arată când teancul se poate schimba sub componentă.
 *
 * O zonă de clic duce la alt material fără să demonteze teancul: React Router
 * schimbă doar datele, componenta rămâne pe loc — și, cu ea, numărul paginii.
 * Dacă materialul următor are mai puține pagini (suportul de lectură are 2,
 * studiul de caz are 10), indicele vechi iese din tablou și randarea crapă.
 * La teanc nou se pornește de la prima pagină; la același teanc, indicele e
 * doar mărginit, fiindcă numărul de pagini se poate micșora (vitrina taie
 * teancul după paginile permise).
 */
export function pageForBook(index: number, slots: number, sameBook: boolean): number {
	return clampPage(sameBook ? index : 0, slots);
}

/** Ține indicele între prima și ultima pagină — cartea nu e circulară. */
export function clampPage(index: number, count: number): number {
	if (count <= 0) return 0;
	if (!Number.isFinite(index)) return 0;
	const i = Math.floor(index);
	if (i < 0) return 0;
	if (i > count - 1) return count - 1;
	return i;
}
