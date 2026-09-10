import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/clasa";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getSecrets } from "../lib/env";
import { listMaterialsForGrade } from "../lib/content";
import { countPublished } from "../lib/questions";
import { listAnnouncementsForStudent } from "../lib/announcements";
import { listOpenAssignmentsForStudent } from "../lib/assignments";
import { getTokenById } from "../lib/tokens";
import { resolveViewer } from "../lib/guard";
import { buildSeenCookie, isSecureRequest, readSeenMap, SEEN_REFRESH_MS } from "../lib/session";
import { SiteHeader, SiteFooter } from "../components/site";
import { GradeBrowse } from "../components/GradeBrowse";
import { Kicker, roman } from "../components/atlas";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("student.library"), path: "/clasa", noindex: true });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const gradeId = params.gradeId;
	const grade = gradeById(gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const resolved = await resolveViewer(request, env);
	const { isAdmin, isStudent, isTeacher } = resolved;
	const studentGrade = resolved.gradeId;

	// Students may only browse their own grade. Admin may browse any grade.
	if (!isAdmin) {
		if (!isStudent) throw redirect("/intra");
		if (studentGrade !== gradeId) throw redirect(`/clasa/${studentGrade}`);
	}

	const locale = subjectConfig.defaultLocale;
	const db = getDb(env);
	// Students see only published materials; admin previewing sees drafts too.
	const materials = await listMaterialsForGrade(db, gradeId, locale, "student", isAdmin);

	const topics = await Promise.all(
		topicsForGrade(gradeId).map(async (topic) => ({
			...topic,
			materials: materials.filter((m) => m.topicSlug === topic.slug),
			quizCount: await countPublished(db, gradeId, topic.slug),
		})),
	);

	// „Nou" badges + anunțuri necitite — students only (admin preview shows no badges).
	const secret = getSecrets(env).sessionSecret;
	const now = Date.now();
	let newSince: number | null = null;
	let setCookie: string | null = null;
	if (isStudent) {
		const seen = await readSeenMap(request, secret);
		newSince = seen[gradeId] ?? null;
		if (newSince === null || now - newSince > SEEN_REFRESH_MS) {
			setCookie = await buildSeenCookie({ ...seen, [gradeId]: now }, secret, isSecureRequest(request));
		}
	}
	// Announcements + open teme for this student's class (own class + grade-wide from the token's issuer).
	let anns: { id: string; body: string; pinned: boolean; createdAt: number; unread: boolean }[] = [];
	let temeCount = 0;
	if (resolved.isStudent && resolved.tokenId) {
		const token = await getTokenById(getDb(env), resolved.tokenId);
		if (token) {
			const rows = await listAnnouncementsForStudent(getDb(env), {
				gradeId,
				tokenId: token.id,
				issuedBy: token.issuedBy,
			});
			anns = rows.map((a) => ({
				id: a.id,
				body: a.body,
				pinned: a.pinned === 1,
				createdAt: a.createdAt,
				unread: newSince !== null && a.createdAt > newSince,
			}));
			const open = await listOpenAssignmentsForStudent(getDb(env), { gradeId, tokenId: token.id, issuedBy: token.issuedBy });
			temeCount = open.length;
		}
	}

	const payload = { grade, topics, isAdmin, isTeacher, newSince, anns, temeCount };
	return setCookie ? data(payload, { headers: { "Set-Cookie": setCookie } }) : payload;
}

export default function ClasaBrowse({ loaderData }: Route.ComponentProps) {
	const { grade, topics, isAdmin, isTeacher, newSince, anns, temeCount } = loaderData;
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					isAdmin ? (
						<Link to="/admin" className="text-sm font-medium text-primary">
							Panou admin
						</Link>
					) : (
						<div className="flex items-center gap-3">
							{isTeacher && (
								<Link to="/profesor" className="text-sm font-medium text-primary">
									Cont profesor
								</Link>
							)}
							<Form method="post" action="/iesire" className="inline">
								<button
									type="submit"
									className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
								>
									{t("nav.logout")}
								</button>
							</Form>
						</div>
					)
				}
			/>

			<main className="mx-auto max-w-5xl px-5 py-8">
				<div className="relative isolate cat-rise mb-8">
					<Kicker>
						{t("atlas.plate")} {roman(Number(grade.id))} · {isAdmin ? "Vizualizare admin" : t("student.library")}
					</Kicker>
					<h1 className="mt-1 text-4xl font-heading font-bold">{grade.label}</h1>
					<p className="mt-1 text-sm text-muted tabular-nums">
						{topics.reduce((s, tp) => s + tp.materials.length, 0)} materiale · {topics.length} teme
					</p>
				</div>

				{anns.length > 0 && (
					<section className="cat-rise plate paper mb-8 p-5">
						<h2 className="mb-3 font-heading text-lg font-semibold">{t("announcements.student_title")}</h2>
						<ul className="grid gap-3">
							{anns.slice(0, 5).map((a) => (
								<li key={a.id} className="flex gap-2 text-sm">
									{a.unread && <span aria-label="nou" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
									<div className="min-w-0">
										{a.pinned && <span aria-hidden className="mr-1">📌</span>}
										<span className="whitespace-pre-line">{a.body}</span>
										<span className="ml-2 text-xs text-muted">{new Date(a.createdAt).toLocaleDateString("ro-RO")}</span>
									</div>
								</li>
							))}
						</ul>
						{anns.length > 5 && (
							<details className="mt-3">
								<summary className="cursor-pointer text-sm font-medium text-primary">{t("announcements.show_all")} ({anns.length})</summary>
								<ul className="mt-3 grid gap-3">
									{anns.slice(5).map((a) => (
										<li key={a.id} className="text-sm">
											<span className="whitespace-pre-line">{a.body}</span>
											<span className="ml-2 text-xs text-muted">{new Date(a.createdAt).toLocaleDateString("ro-RO")}</span>
										</li>
									))}
								</ul>
							</details>
						)}
					</section>
				)}

				<Link
					to={`/clasa/${grade.id}/exerseaza`}
					viewTransition
					className="glow cat-rise plate paper mb-8 flex items-center justify-between gap-4 p-5"
				>
					<div>
						<h2 className="font-heading text-lg font-semibold">{t("practice.cta")}</h2>
						<p className="text-sm text-muted">{t("practice.sheet.sub")}</p>
						{temeCount > 0 && (
							<p className="mt-1 text-sm font-medium text-accent-strong">
								{temeCount === 1 ? "1 temă de rezolvat" : `${temeCount} teme de rezolvat`} →
							</p>
						)}
					</div>
					<span className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
						{t("practice.cta")} →
					</span>
				</Link>

				<GradeBrowse gradeId={grade.id} topics={topics} isAdmin={isAdmin} newSince={newSince} collapsible />
				<SiteFooter />
			</main>
		</div>
	);
}
