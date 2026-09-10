import { Form, Link } from "react-router";
import { t, topicLabelBySlug, topicsForGrade } from "../config/subject";
import type { Assignment } from "../db/schema";
import type { TokenOption } from "./AnnouncementsManager";

export function AssignmentsManager({
	assignments,
	grades,
	tokensByGrade,
	tokenLabels,
	resultsBasePath,
	error,
}: {
	assignments: Assignment[];
	grades: { id: string; label: string }[];
	tokensByGrade: Record<string, TokenOption[]>;
	tokenLabels: Record<string, string>;
	resultsBasePath: string; // "/admin/rezultate" | "/profesor/rezultate"
	error?: string;
}) {
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");
	return (
		<div className="grid gap-8">
			<Form method="post" className="plate paper grid gap-4 p-6">
				<h2 className="font-heading text-lg font-semibold">{t("assignments.new")}</h2>
				<input type="hidden" name="intent" value="create" />
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("assignments.name")}</span>
					<input name="title" required maxLength={120} className="rounded-md border border-border bg-bg px-3 py-2.5" />
				</label>
				<div className="grid gap-4 sm:grid-cols-2">
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Clasa (an de studiu)</span>
						<select name="gradeId" required className="rounded-md border border-border bg-bg px-3 py-2.5">
							{grades.map((g) => (
								<option key={g.id} value={g.id}>{g.label}</option>
							))}
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Doar pentru clasa…</span>
						<select name="tokenId" className="rounded-md border border-border bg-bg px-3 py-2.5">
							<option value="">{t("announcements.target_all")}</option>
							{Object.entries(tokensByGrade).flatMap(([gid, toks]) =>
								toks.map((tk) => (
									<option key={tk.id} value={tk.id}>
										{grades.find((g) => g.id === gid)?.label} · {tk.label}
									</option>
								)),
							)}
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Tema (capitol)</span>
						<select name="topicSlug" className="rounded-md border border-border bg-bg px-3 py-2.5">
							<option value="">{t("assignments.topic_any")}</option>
							{grades.flatMap((g) =>
								topicsForGrade(g.id).map((tp) => (
									<option key={`${g.id}:${tp.slug}`} value={tp.slug}>
										{g.label} · {tp.label}
									</option>
								)),
							)}
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">{t("assignments.count")}</span>
						<select name="length" defaultValue="10" className="rounded-md border border-border bg-bg px-3 py-2.5">
							<option value="5">5</option>
							<option value="10">10</option>
							<option value="20">20</option>
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">{t("assignments.due")}</span>
						<input type="date" name="dueAt" className="rounded-md border border-border bg-bg px-3 py-2.5" />
					</label>
				</div>
				{error && <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}
				<button className="justify-self-start rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-strong">
					{t("assignments.create")}
				</button>
			</Form>

			{assignments.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("assignments.empty")}</p>
			) : (
				<div className="grid gap-3">
					{assignments.map((a) => (
						<div key={a.id} className={`rounded-xl border border-border bg-surface p-4 ${a.closedAt ? "opacity-60" : ""}`}>
							<div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
								<span>{grades.find((g) => g.id === a.gradeId)?.label ?? a.gradeId}</span>
								<span>· {a.tokenId ? (tokenLabels[a.tokenId] ?? t("announcements.deleted_class")) : t("announcements.target_all")}</span>
								<span>· {a.topicSlug ? topicLabelBySlug(a.topicSlug) : t("assignments.topic_any")}</span>
								<span>· {fmt(a.createdAt)}</span>
								{a.dueAt && <span>· {t("assignments.due_by")} {fmt(a.dueAt)}</span>}
								{a.closedAt && <span className="rounded bg-ink/10 px-1.5 py-0.5">{t("assignments.closed")}</span>}
							</div>
							<p className="font-medium">{a.title}</p>
							<div className="mt-2 flex items-center gap-4 text-sm">
								<Link to={`${resultsBasePath}?tema=${a.id}`} className="font-medium text-primary hover:underline">
									{t("assignments.see_results")}
								</Link>
								{!a.closedAt && (
									<Form method="post" onSubmit={(e) => { if (!confirm(t("assignments.close_confirm"))) e.preventDefault(); }}>
										<input type="hidden" name="intent" value="close" />
										<input type="hidden" name="id" value={a.id} />
										<button className="font-medium text-muted hover:text-ink">{t("assignments.close")}</button>
									</Form>
								)}
								<Form method="post" onSubmit={(e) => { if (!confirm(t("assignments.delete_confirm"))) e.preventDefault(); }}>
									<input type="hidden" name="intent" value="delete" />
									<input type="hidden" name="id" value={a.id} />
									<button className="font-medium text-accent-strong hover:underline">Șterge</button>
								</Form>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
