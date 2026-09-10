// Păreri publice — nucleul pur (validare + filtrare) și interogările D1.
//
// Pagina `/pareri` de pe instanța liberă e PRIMA cale de scriere publică din tot proiectul
// (ADR-0008 spunea că instanța liberă nu scrie nimic în D1). Regulile de mai jos există ca să
// nu strice garanția: fără cont, fără cookie, fără sesiune, fără e-mail, fără IP.
//
// Podeaua de acces stă în trei reguli, toate pe server:
//   1. loaderul public cere NUMAI `status = 'approved'` (`listApprovedReviews`);
//   2. inserarea IMPUNE `status = 'pending'` — câmpul nu se citește niciodată din formular;
//   3. textul se randează ca text simplu, deci un link rămâne text mort chiar și aprobat.
//
// Modulul e pur în partea de validare, ca `lib/demo.ts`: `reviews.test.ts` îl acoperă fără
// bază de date. Copia în română NU stă aici — erorile întorc CHEI din `subject.config.strings`,
// ca motorul să rămână subiect-agnostic și traductibil.

import { desc, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { reviews, type Review } from "../db/schema";
import { subjectConfig } from "../config/subject";
import { randomId } from "./crypto";
import { bcp47Locale } from "./seo";

/**
 * Cine scrie părerea. Listă ÎNCHISĂ la nivel de motor: n-are nimic dintr-o materie anume,
 * deci nu are ce căuta în `subject.config`. Etichetele afișate, în schimb, sunt `t()`-uri
 * (`reviews.role.*`), pentru că ele sunt text pentru om.
 */
export const ROLES = ["elev", "profesor", "parinte", "altcineva"] as const;
export type ReviewRole = (typeof ROLES)[number];

/** Stările prin care trece o părere. `pending` e singura pe care o poate produce publicul. */
export const STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof STATUSES)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 5;
/** Numele se TAIE la lungimea asta, nu se respinge — vezi `validateReview`. */
export const NAME_MAX = 40;
export const BODY_MIN = 10;
export const BODY_MAX = 1000;

/** Câmpurile care pot produce o eroare de validare. Numele nu e printre ele, intenționat. */
export type ReviewField = "role" | "rating" | "body";
export type ReviewErrors = Partial<Record<ReviewField, string>>;

/** Rândul curat, gata de inserat. Fără `id` și fără `createdAt`: alea se pun la scriere,
 *  nu se acceptă de la apelant. `status` e literalmente `"pending"` în tip, nu doar în valoare. */
export interface CleanReview {
	name: string | null;
	role: ReviewRole;
	rating: number;
	body: string;
	status: "pending";
}

export type ReviewValidation =
	| { ok: true; review: CleanReview }
	| { ok: false; errors: ReviewErrors };

/**
 * Curăță un text venit din formular:
 *   - caracterele invizibile de format (lățime zero, suprascriere de direcție) se scot de tot;
 *   - caracterele de control (inclusiv `\n` și `\t`) devin spațiu, ca două cuvinte lipite de
 *     un rând nou să nu se unească într-unul singur;
 *   - șirurile de spații albe se colapsează la unul, iar capetele se taie.
 * Lungimile se măsoară pe rezultatul ăsta, nu pe ce a trimis browserul.
 */
export function cleanText(raw: unknown): string {
	if (typeof raw !== "string") return "";
	return raw
		.normalize("NFC")
		.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
		.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/** Taie la `max` fără să lase un spațiu atârnat când tăietura cade în mijlocul unui cuvânt. */
function truncate(text: string, max: number): string {
	return text.length <= max ? text : text.slice(0, max).trim();
}

export function isReviewRole(value: unknown): value is ReviewRole {
	return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isReviewStatus(value: unknown): value is ReviewStatus {
	return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

/** Stelele: număr ÎNTREG în 1–5. „3.5", „3 stele", „" și NaN sunt toate refuzate. */
function parseRating(raw: unknown): number | null {
	const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
	if (!/^[+-]?\d+$/.test(text)) return null;
	const n = Number(text);
	return n >= RATING_MIN && n <= RATING_MAX ? n : null;
}

/**
 * Validarea completă a unei păreri trimise de public.
 *
 * Întoarce ori erorile pe câmpuri (toate deodată, nu doar prima — altfel omul trimite de
 * patru ori la rând), ori rândul curat. `status` e ÎNTOTDEAUNA `pending`: intrarea nici măcar
 * nu e citită pentru el, deci un POST fabricat cu `status=approved` nu poate publica nimic.
 */
export function validateReview(input: Record<string, unknown>): ReviewValidation {
	const errors: ReviewErrors = {};

	const role = input.role;
	if (!isReviewRole(role)) errors.role = "reviews.err.role";

	const rating = parseRating(input.rating);
	if (rating === null) errors.rating = "reviews.err.rating";

	const body = cleanText(input.body);
	if (body.length < BODY_MIN) errors.body = "reviews.err.body_short";
	else if (body.length > BODY_MAX) errors.body = "reviews.err.body_long";

	if (Object.keys(errors).length > 0) return { ok: false, errors };

	// Numele e opțional și se TAIE, nu se respinge: nimeni nu trebuie să piardă un text de
	// zece rânduri pentru că și-a scris porecla prea lung.
	const name = truncate(cleanText(input.name), NAME_MAX);

	return {
		ok: true,
		review: {
			name: name === "" ? null : name,
			role: role as ReviewRole,
			rating: rating as number,
			body,
			status: "pending",
		},
	};
}

/**
 * Filtrarea publică: doar `approved`, cele mai noi întâi. Comparația e strictă — un status
 * pe care nu-l cunoaște nimeni („APPROVED", "") NU trece; podeaua nu ghicește intenții.
 */
export function visibleReviews<T extends { status: string; createdAt: number }>(rows: readonly T[]): T[] {
	return rows.filter((r) => r.status === "approved").sort((a, b) => b.createdAt - a.createdAt);
}

/** „septembrie 2026" — data unei păreri se arată pe lună, nu pe zi (o zi e prea precisă). */
export function monthLabel(ts: number, locale: string = bcp47Locale(subjectConfig.defaultLocale)): string {
	return new Date(ts).toLocaleDateString(locale, { month: "long", year: "numeric" });
}

// ---- Interogări D1 (aceeași convenție ca lib/announcements.ts) ----

/** Lista publică. Filtrul de status e AICI, în SQL — nu în componentă. */
export async function listApprovedReviews(db: DB): Promise<Review[]> {
	return db
		.select()
		.from(reviews)
		.where(eq(reviews.status, "approved"))
		.orderBy(desc(reviews.createdAt));
}

/** Tot ce există, pentru coada de moderare din /admin/pareri. */
export async function listAllReviews(db: DB): Promise<Review[]> {
	return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

/** Inserarea publică. `status: "pending"` e scris literal, nu luat din `review`. */
export async function insertReview(db: DB, review: CleanReview): Promise<string> {
	const id = randomId();
	await db.insert(reviews).values({
		id,
		name: review.name,
		role: review.role,
		rating: review.rating,
		body: review.body,
		status: "pending",
		createdAt: Date.now(),
	});
	return id;
}

/** Schimbarea stării trăiește doar în /admin/pareri, care nici nu există în bundle-ul liber. */
export async function setReviewStatus(db: DB, id: string, status: ReviewStatus): Promise<void> {
	await db.update(reviews).set({ status }).where(eq(reviews.id, id));
}

export async function deleteReview(db: DB, id: string): Promise<void> {
	await db.delete(reviews).where(eq(reviews.id, id));
}
