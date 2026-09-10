import { Link } from "react-router";
import { gradeById, t } from "../config/subject";

export interface StatsData {
	perDay: { day: string; views: number }[];
	top: { materialId: string; title: string; gradeId: string; views: number }[];
	perClass: { tokenId: string; label: string; gradeId: string; views: number }[];
	unviewed: { title: string; gradeId: string }[];
	totalViews30: number;
}

export function StatsView({ stats, resultsPath }: { stats: StatsData; resultsPath: string }) {
	const gradeLabel = (id: string) => gradeById(id)?.label ?? id;
	const maxDay = Math.max(1, ...stats.perDay.map((d) => d.views));
	const maxTop = Math.max(1, ...stats.top.map((m) => m.views));
	if (stats.totalViews30 === 0 && stats.top.length === 0) {
		return <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("stats.empty")}</p>;
	}
	return (
		<div className="grid gap-8">
			<section>
				<h2 className="mb-3 text-xl font-semibold">{t("stats.views_30")}</h2>
				<div className="rounded-xl border border-border bg-surface p-4">
					<div className="flex h-24 items-end gap-[2px]" role="img" aria-label={`${stats.totalViews30} vizualizări în 30 de zile`}>
						{stats.perDay.map((d) => (
							<span key={d.day} title={`${d.day}: ${d.views}`} className="flex-1 rounded-t bg-primary" style={{ height: `${(d.views / maxDay) * 100}%`, minHeight: d.views ? 2 : 0 }} />
						))}
					</div>
					<p className="mt-2 text-xs text-muted">{stats.totalViews30} vizualizări în total</p>
				</div>
			</section>

			{stats.top.length > 0 && (
				<section>
					<h2 className="mb-3 text-xl font-semibold">{t("stats.top")}</h2>
					<div className="grid gap-2">
						{stats.top.map((m) => (
							<div key={m.materialId} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
								<span className="w-24 shrink-0 text-xs text-muted">{gradeLabel(m.gradeId)}</span>
								<span className="min-w-0 flex-1 truncate font-medium">{m.title}</span>
								<span className="h-3 shrink-0 rounded bg-primary" style={{ width: `${(m.views / maxTop) * 120}px`, minWidth: 8 }} />
								<span className="w-10 shrink-0 text-right tabular-nums text-muted">{m.views}</span>
							</div>
						))}
					</div>
				</section>
			)}

			{stats.perClass.length > 0 && (
				<section>
					<h2 className="mb-3 text-xl font-semibold">{t("stats.per_class")}</h2>
					<div className="grid gap-2">
						{stats.perClass.map((c) => (
							<div key={c.tokenId} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
								<span className="font-medium">{gradeLabel(c.gradeId)} · {c.label}</span>
								<span className="tabular-nums text-muted">{c.views} vizualizări</span>
							</div>
						))}
					</div>
				</section>
			)}

			{stats.unviewed.length > 0 && (
				<section>
					<h2 className="mb-1 text-xl font-semibold">{t("stats.unviewed")}</h2>
					<p className="mb-3 text-sm text-muted">{t("stats.unviewed_sub")}</p>
					<ul className="grid gap-1.5 text-sm">
						{stats.unviewed.map((m, i) => (
							<li key={i} className="rounded-md border border-dashed border-border px-3 py-2">
								<span className="mr-2 text-xs text-muted">{gradeLabel(m.gradeId)}</span>
								{m.title}
							</li>
						))}
					</ul>
				</section>
			)}

			<p className="text-sm text-muted">
				{t("stats.practice_pointer")} <Link to={resultsPath} className="font-medium text-primary hover:underline">Rezultate →</Link>
			</p>
		</div>
	);
}
