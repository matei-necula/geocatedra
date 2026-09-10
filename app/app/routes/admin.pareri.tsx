import { Form, redirect } from "react-router";
import type { Route } from "./+types/admin.pareri";
import { t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import {
	RATING_MAX,
	deleteReview,
	listAllReviews,
	monthLabel,
	setReviewStatus,
} from "../lib/reviews";
import type { Review } from "../db/schema";
import { AdminShell } from "../components/AdminShell";
import { seo } from "../lib/seo";

/**
 * Moderarea părerilor scrise pe site-ul liber.
 *
 * Ruta e în `claseOnly`, deci nu există fizic în bundle-ul liber — nimeni de acolo nu poate
 * ajunge la ea, oricâte adrese ar încerca. Baza e însă comună: o părere publicată de aici
 * apare pe `/pareri` imediat, fără deploy, exact ca publicarea unui material.
 */

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("reviews.title"), path: "/admin/pareri", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	return { reviews: await listAllReviews(getDb(env)) };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	const id = String(form.get("id"));

	// Intențiile sunt o listă închisă, nu un status luat din formular: un `intent` necunoscut
	// nu face nimic, în loc să scrie o stare pe care n-a definit-o nimeni.
	if (intent === "approve") await setReviewStatus(db, id, "approved");
	else if (intent === "reject") await setReviewStatus(db, id, "rejected");
	else if (intent === "delete") await deleteReview(db, id);
	return { ok: true };
}

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

function ReviewCard({ review, actions }: { review: Review; actions: React.ReactNode }) {
	return (
		<li className="rounded-2xl border border-border bg-surface p-5">
			<div className="flex flex-wrap items-center gap-3">
				<Stars rating={review.rating} />
				<span className="text-sm text-muted">
					{review.name ?? t("reviews.anonymous")} · {t(`reviews.role.${review.role}`)} ·{" "}
					{monthLabel(review.createdAt)}
				</span>
			</div>
			{/* Text simplu, ca pe pagina publică: nimic din ce scrie un vizitator nu se
			    interpretează, nici măcar în pagina de moderare. */}
			<p className="mt-3">{review.body}</p>
			<div className="mt-4 flex flex-wrap gap-2">{actions}</div>
		</li>
	);
}

function ActionButton({
	intent,
	id,
	label,
	className,
	confirm,
}: {
	intent: string;
	id: string;
	label: string;
	className: string;
	confirm?: string;
}) {
	return (
		<Form
			method="post"
			onSubmit={(e) => {
				if (confirm && !window.confirm(confirm)) e.preventDefault();
			}}
		>
			<input type="hidden" name="intent" value={intent} />
			<input type="hidden" name="id" value={id} />
			<button type="submit" className={className}>
				{label}
			</button>
		</Form>
	);
}

const BTN_PRIMARY =
	"rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-strong";
const BTN_QUIET =
	"rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-ink";
const BTN_DANGER =
	"rounded-lg border border-accent-strong px-4 py-2 text-sm font-medium text-accent-strong transition hover:bg-accent/10";

export default function AdminPareri({ loaderData }: Route.ComponentProps) {
	const { reviews } = loaderData;
	const pending = reviews.filter((r) => r.status === "pending");
	const approved = reviews.filter((r) => r.status === "approved");
	const rejected = reviews.filter((r) => r.status === "rejected");

	const del = (id: string) => (
		<ActionButton
			intent="delete"
			id={id}
			label={t("reviews.admin.delete")}
			className={BTN_DANGER}
			confirm={t("reviews.admin.delete_confirm")}
		/>
	);

	return (
		<AdminShell title={t("reviews.title")}>
			<p className="mb-8 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
				{t("reviews.admin.note")}
			</p>

			<section className="mb-10">
				<h2 className="mb-3 text-xl font-semibold">
					{t("reviews.admin.pending")}
					{pending.length > 0 && (
						<span className="ml-2 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
							{pending.length}
						</span>
					)}
				</h2>
				{pending.length === 0 ? (
					<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
						{t("reviews.admin.empty_pending")}
					</p>
				) : (
					<ul className="grid gap-4">
						{pending.map((r) => (
							<ReviewCard
								key={r.id}
								review={r}
								actions={
									<>
										<ActionButton intent="approve" id={r.id} label={t("reviews.admin.approve")} className={BTN_PRIMARY} />
										<ActionButton intent="reject" id={r.id} label={t("reviews.admin.reject")} className={BTN_QUIET} />
										{del(r.id)}
									</>
								}
							/>
						))}
					</ul>
				)}
			</section>

			<section className="mb-10">
				<h2 className="mb-3 text-xl font-semibold">
					{t("reviews.admin.published")}{" "}
					<span className="text-sm font-normal text-muted">({approved.length})</span>
				</h2>
				{approved.length === 0 ? (
					<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
						{t("reviews.admin.empty_published")}
					</p>
				) : (
					<ul className="grid gap-4">
						{approved.map((r) => (
							<ReviewCard
								key={r.id}
								review={r}
								actions={
									<>
										<ActionButton intent="reject" id={r.id} label={t("reviews.admin.reject")} className={BTN_QUIET} />
										{del(r.id)}
									</>
								}
							/>
						))}
					</ul>
				)}
			</section>

			{rejected.length > 0 && (
				<section>
					<h2 className="mb-3 text-xl font-semibold">
						{t("reviews.admin.rejected")}{" "}
						<span className="text-sm font-normal text-muted">({rejected.length})</span>
					</h2>
					<ul className="grid gap-4">
						{rejected.map((r) => (
							<ReviewCard
								key={r.id}
								review={r}
								actions={
									<>
										<ActionButton intent="approve" id={r.id} label={t("reviews.admin.approve")} className={BTN_PRIMARY} />
										{del(r.id)}
									</>
								}
							/>
						))}
					</ul>
				</section>
			)}
		</AdminShell>
	);
}
