import { Link } from "react-router";
import { t } from "../config/subject";
import type { Assignment } from "../db/schema";
import type { AssignmentResults as ResultsData } from "../lib/assignments";

export function AssignmentResults({
	assignments,
	selected,
	results,
	basePath,
	temePath,
}: {
	assignments: Assignment[];
	selected: Assignment | null;
	results: ResultsData | null;
	basePath: string; // "/admin/rezultate" | "/profesor/rezultate"
	temePath: string; // "/admin/teme" | "/profesor/teme"
}) {
	if (assignments.length === 0) return null;
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");
	return (
		<section className="border-t border-border pt-6">
			<div className="mb-3 flex items-center justify-between">
				<h2 className="text-xl font-semibold">{t("assignments.title")}</h2>
				<Link to={temePath} className="text-sm font-medium text-primary hover:underline">{t("assignments.new")} →</Link>
			</div>
			<div className="mb-4 flex flex-wrap gap-2">
				{assignments.map((a) => (
					<Link
						key={a.id}
						to={`${basePath}?tema=${a.id}`}
						className={`rounded-full border px-3 py-1.5 text-sm ${selected?.id === a.id ? "border-primary bg-primary text-on-primary" : "border-border"} ${a.closedAt ? "opacity-60" : ""}`}
					>
						{a.title}
					</Link>
				))}
			</div>
			{selected && results && (
				<>
					<p className="mb-3 text-sm text-muted">
						{results.completed} {results.completed === 1 ? "elev a rezolvat" : "elevi au rezolvat"} · scor mediu {results.avgPct}%
					</p>
					<p className="mb-4 rounded-md bg-sand/30 px-3 py-2 text-sm">{t("assignments.roster_note")}</p>
					{results.rows.length > 0 && (
						<div className="overflow-hidden rounded-2xl border border-border">
							<table className="w-full text-left text-sm">
								<thead className="bg-bg text-muted">
									<tr>
										<th className="px-4 py-3 font-medium">Poreclă</th>
										<th className="px-4 py-3 font-medium">Scor</th>
										<th className="px-4 py-3 font-medium">Notă</th>
										<th className="px-4 py-3 font-medium">Data</th>
									</tr>
								</thead>
								<tbody>
									{results.rows.map((r) => (
										<tr key={r.nickname} className="border-t border-border bg-surface">
											<td className="px-4 py-3 font-medium">{r.nickname}</td>
											<td className="px-4 py-3">{r.correct} / {r.total} ({r.pct}%)</td>
											<td className="px-4 py-3">{r.nota}</td>
											<td className="px-4 py-3 text-muted">
												{fmt(r.createdAt)}
												{r.late && <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent-strong">{t("assignments.late")}</span>}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</section>
	);
}
