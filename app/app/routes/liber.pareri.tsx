import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/liber.pareri";
import { t } from "../config/subject";
import { getDb } from "../db/client";
import {
	BODY_MAX,
	NAME_MAX,
	RATING_MAX,
	RATING_MIN,
	ROLES,
	insertReview,
	listApprovedReviews,
	monthLabel,
	validateReview,
	type ReviewErrors,
} from "../lib/reviews";
import { turnstileKeys } from "../lib/env";
import { checkTurnstile } from "../lib/turnstile";
import { clientIp, underLimit } from "../lib/ratelimit";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Turnstile } from "../components/Turnstile";
import { Kicker } from "../components/atlas";
import { seo } from "../lib/seo";

/**
 * `/pareri` — prima suprafață din tot proiectul prin care publicul SCRIE ceva în D1.
 *
 * Podeaua de acces, în ordinea în care se execută în `action`:
 *   1. **honeypot** — un câmp ascuns care trebuie să rămână gol (taie boții simpli gratis);
 *   2. **`REVIEW_LIMITER`** — 3 cereri/60s pe IP;
 *   3. **Turnstile** — inert cât timp lipsesc cheile, obligatoriu din clipa în care sunt puse.
 * Primele două întorc EXACT același mesaj calm: nimeni nu află care apărare l-a oprit.
 *
 * Loaderul cere numai părerile aprobate, iar inserarea impune `status = 'pending'` în
 * `lib/reviews.ts` — un POST fabricat cu `status=approved` nu publică nimic.
 *
 * Nu se scrie niciun cookie și nu se citește nicio sesiune: pagina rămâne în garanția
 * instanței libere (fără conturi, fără urme pe dispozitiv).
 */

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: t("reviews.title"),
		description: t("reviews.meta_desc"),
		path: "/pareri",
		origin: data?.origin,
	});
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const db = getDb(env);
	// Filtrul de status stă în SQL (`listApprovedReviews`), nu în componentă: ce nu e aprobat
	// nu pleacă niciodată de pe server, deci nu poate ajunge nici în HTML, nici în payload.
	const reviews = await listApprovedReviews(db);
	return {
		reviews: reviews.map((r) => ({
			id: r.id,
			name: r.name,
			role: r.role,
			rating: r.rating,
			body: r.body,
			month: monthLabel(r.createdAt),
		})),
		turnstileSiteKey: turnstileKeys(env).siteKey,
		origin: new URL(request.url).origin,
	};
}

interface ActionResult {
	sent?: true;
	error?: string;
	errors?: ReviewErrors;
	values?: { name: string; role: string; rating: string; body: string };
}

export async function action({ request, context }: Route.ActionArgs): Promise<ActionResult> {
	const env = context.cloudflare.env;
	const form = await request.formData();
	const blocked: ActionResult = { error: t("reviews.err.blocked") };

	// 1. Honeypot. Un om nu vede câmpul, deci nu-l poate completa; un bot care umple tot ce
	//    găsește îl completează. Același răspuns ca la limitator — niciun indiciu.
	if (String(form.get("email") ?? "") !== "") return blocked;

	// 2. Limitatorul de rată. Cade DESCHIS dacă bindingul lipsește (vezi lib/ratelimit.ts).
	if (!(await underLimit(env, "REVIEW_LIMITER", `pareri:${clientIp(request)}`))) return blocked;

	// 3. Turnstile — mesajul lui rămâne al lui: „reîncarcă pagina" e un sfat util, nu un
	//    indiciu despre apărare, iar omul chiar are ce face cu el.
	const turnstileError = await checkTurnstile(turnstileKeys(env), request, form);
	if (turnstileError) return { error: turnstileError };

	const values = {
		name: String(form.get("name") ?? ""),
		role: String(form.get("role") ?? ""),
		rating: String(form.get("rating") ?? ""),
		body: String(form.get("body") ?? ""),
	};
	// `status` NU e citit din formular, nici aici, nici în validateReview.
	const result = validateReview(values);
	if (!result.ok) return { errors: result.errors, values };

	await insertReview(getDb(env), result.review);
	return { sent: true };
}

const STARS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MAX - i);

/** Stelele unei păreri publicate. Decor pentru ochi, text pentru cititorul de ecran. */
function Stars({ rating }: { rating: number }) {
	return (
		<span className="text-accent-strong">
			<span aria-hidden>
				{"★".repeat(rating)}
				<span className="text-border">{"★".repeat(RATING_MAX - rating)}</span>
			</span>
			<span className="sr-only">{t(`reviews.rating.${rating}`)}</span>
		</span>
	);
}

/**
 * Eroarea unui câmp. Poartă un `id` fix pentru că e legată de câmp cu `aria-describedby`:
 * un cititor de ecran care ajunge pe „Părerea ta" trebuie să audă și de ce a fost respinsă,
 * nu doar eticheta. `role="alert"` o anunță și la apariție, pentru cine e deja în formular.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
	if (!message) return null;
	return (
		<p id={id} role="alert" className="text-sm text-accent-strong">
			{t(message)}
		</p>
	);
}

export default function LiberPareri({ loaderData, actionData }: Route.ComponentProps) {
	const { reviews, turnstileSiteKey } = loaderData;
	const nav = useNavigation();
	const busy = nav.state !== "idle";
	const errors = actionData?.errors;
	const values = actionData?.values;

	const inputClass =
		"w-full rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary";

	return (
		<>
			<LiberHeader
				right={
					<Link to="/" className="text-sm underline-offset-4 hover:underline">
						{t("liber.back.home")}
					</Link>
				}
			/>
			{/* `id`/`tabIndex` fac din conținut o țintă de sărit peste antet: un link „Sari la
			    conținut" sau o ancoră `#continut` aduce focalizarea AICI, nu doar derularea. */}
			<main id="continut" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-10">
				<Kicker>{t("reviews.kicker")}</Kicker>
				<h1 className="font-heading mt-2 text-3xl">{t("reviews.title")}</h1>
				<p className="mt-3 max-w-prose text-muted">{t("reviews.lead")}</p>

				{/* Zona vie a confirmării. Containerul e randat MEREU, chiar și gol: o regiune
				    `aria-live` adăugată în DOM odată cu textul nu se anunță — cititorul de ecran
				    trebuie s-o fi observat înainte ca ea să se schimbe. */}
				<div aria-live="polite">
					{actionData?.sent && (
						<div className="mt-8 rounded-lg border border-primary bg-primary/5 p-6">
							<h2 className="font-heading text-2xl">{t("reviews.thanks")}</h2>
						</div>
					)}
				</div>

				{!actionData?.sent && (
					<section className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
						<h2 className="font-heading text-2xl">{t("reviews.form.title")}</h2>

						<Form method="post" className="mt-5 grid gap-5">
							{/* Honeypot: în afara ecranului, scos din ordinea de tabulare și din
							    arborele de accesibilitate. Un om nu-l vede și nu ajunge la el nici
							    cu tastatura, nici cu cititorul de ecran. */}
							<div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
								<label htmlFor="pareri-email">{t("reviews.form.honeypot")}</label>
								<input id="pareri-email" type="text" name="email" tabIndex={-1} autoComplete="off" />
							</div>

							{/* Stelele sunt un grup de radio-uri, deci `fieldset` + `legend`: fără ele,
							    un cititor de ecran anunță cinci opțiuni fără să spună la ce întrebare. */}
							<fieldset
								className="grid gap-2"
								aria-describedby={errors?.rating ? "pareri-err-stele" : undefined}
							>
								<legend className="text-sm font-semibold">{t("reviews.form.rating")}</legend>
								{/* Ordinea din DOM e 5→1, întoarsă vizual cu `flex-row-reverse` — vezi
								    comentariul de la `.star-rating` din app.css. */}
								<div className="star-rating flex flex-row-reverse justify-end gap-1 text-3xl leading-none">
									{STARS.map((n) => (
										<label key={n} htmlFor={`pareri-stea-${n}`} title={t(`reviews.rating.${n}`)}>
											<input
												id={`pareri-stea-${n}`}
												type="radio"
												name="rating"
												value={n}
												defaultChecked={values?.rating === String(n)}
												className="sr-only"
											/>
											<span aria-hidden>★</span>
											<span className="sr-only">{t(`reviews.rating.${n}`)}</span>
										</label>
									))}
								</div>
								<FieldError id="pareri-err-stele" message={errors?.rating} />
							</fieldset>

							<div className="grid gap-1.5 text-sm">
								<label htmlFor="pareri-rol" className="font-semibold">
									{t("reviews.form.role")}
								</label>
								<select
									id="pareri-rol"
									name="role"
									defaultValue={values?.role ?? ""}
									aria-describedby={errors?.role ? "pareri-err-rol" : undefined}
									className={inputClass}
								>
									<option value="">—</option>
									{ROLES.map((role) => (
										<option key={role} value={role}>
											{t(`reviews.role.${role}`)}
										</option>
									))}
								</select>
								<FieldError id="pareri-err-rol" message={errors?.role} />
							</div>

							<div className="grid gap-1.5 text-sm">
								<label htmlFor="pareri-nume" className="font-semibold">
									{t("reviews.form.name")}
								</label>
								<input
									id="pareri-nume"
									name="name"
									maxLength={NAME_MAX}
									autoComplete="off"
									placeholder={t("reviews.form.name_placeholder")}
									defaultValue={values?.name ?? ""}
									// Avertismentul „nu numele întreg" e legat de câmp, nu doar așezat
									// sub el: altfel un cititor de ecran anunță „Nume (opțional)" și
									// atât, exact acolo unde sfatul contează cel mai mult.
									aria-describedby="pareri-nume-sfat"
									className={inputClass}
								/>
								<span id="pareri-nume-sfat" className="text-xs text-muted">
									{t("reviews.form.name_hint")}
								</span>
							</div>

							<div className="grid gap-1.5 text-sm">
								<label htmlFor="pareri-text" className="font-semibold">
									{t("reviews.form.body")}
								</label>
								<textarea
									id="pareri-text"
									name="body"
									rows={5}
									maxLength={BODY_MAX}
									placeholder={t("reviews.form.body_placeholder")}
									defaultValue={values?.body ?? ""}
									aria-describedby={errors?.body ? "pareri-err-text" : undefined}
									className={`${inputClass} resize-y`}
								/>
								<FieldError id="pareri-err-text" message={errors?.body} />
							</div>

							<Turnstile siteKey={turnstileSiteKey} />

							{/* A doua zonă vie, tot randată mereu: mesajul calm de la honeypot /
							    limitator / Turnstile. */}
							<div aria-live="polite">
								{actionData?.error && (
									<p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">
										{actionData.error}
									</p>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-4">
								<button
									type="submit"
									disabled={busy}
									className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:bg-accent-strong disabled:opacity-60"
								>
									{busy ? t("reviews.form.sending") : t("reviews.form.submit")}
								</button>
							</div>

							<p className="text-xs text-muted">
								{t("reviews.form.privacy")}{" "}
								<Link to="/confidentialitate" className="text-primary hover:underline">
									{t("footer.privacy")}
								</Link>
							</p>
						</Form>
					</section>
				)}

				<section className="mt-12">
					<h2 className="font-heading text-2xl">{t("reviews.list.title")}</h2>
					{reviews.length === 0 ? (
						<p className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
							{t("reviews.list.empty")}
						</p>
					) : (
						<ul className="mt-5 grid gap-4">
							{reviews.map((r) => (
								<li key={r.id} className="rounded-lg border border-border bg-surface p-5">
									<Stars rating={r.rating} />
									{/* Textul se randează CA TEXT SIMPLU: fără markdown, fără linkuri
									    automate. O părere care conține o adresă rămâne text mort chiar
									    dacă a fost aprobată din greșeală. */}
									<p className="mt-2">{r.body}</p>
									<p className="mt-3 text-xs text-muted">
										{r.name ?? t("reviews.anonymous")} · {t(`reviews.role.${r.role}`)} · {r.month}
									</p>
								</li>
							))}
						</ul>
					)}
				</section>
			</main>
			<LiberFooter />
		</>
	);
}
