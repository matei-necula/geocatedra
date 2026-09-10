import { Form, Link } from "react-router";
import { t, topicLabelBySlug } from "../config/subject";
import type { ResultsView as ResultsData } from "../lib/questions";

export function ResultsView({
	results,
	grades,
	selectedGrade,
	basePath,
	releaseGrade,
	children,
}: {
	results: ResultsData;
	grades: { id: string; label: string }[];
	selectedGrade: string;
	basePath: string;
	releaseGrade?: string;
	children?: React.ReactNode;
}) {
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");
	const maxBucket = Math.max(1, ...results.distribution.map((d) => d.count));
	return (
		<>
			<div className="mb-6 flex flex-wrap gap-2">
				<Link to={basePath} className={`rounded-full border px-3 py-1.5 text-sm ${!selectedGrade ? "border-primary bg-primary text-on-primary" : "border-border"}`}>
					Toate
				</Link>
				{grades.map((g) => (
					<Link key={g.id} to={`${basePath}?grade=${g.id}`} className={`rounded-full border px-3 py-1.5 text-sm ${selectedGrade === g.id ? "border-primary bg-primary text-on-primary" : "border-border"}`}>
						{g.label}
					</Link>
				))}
			</div>

			{results.totalAttempts === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
					Niciun test rezolvat încă{selectedGrade ? " pentru această clasă" : ""}.
				</p>
			) : (
				<div className="grid gap-8">
					<section className="grid gap-4 sm:grid-cols-2">
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-xl border border-border bg-surface px-4 py-3">
								<div className="font-heading text-2xl font-bold">{results.totalAttempts}</div>
								<div className="text-xs text-muted">teste rezolvate</div>
							</div>
							<div className="rounded-xl border border-border bg-surface px-4 py-3">
								<div className="font-heading text-2xl font-bold">{results.avgPct}%</div>
								<div className="text-xs text-muted">scor mediu</div>
							</div>
						</div>
						<div className="rounded-xl border border-border bg-surface p-4">
							<div className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Distribuția scorurilor</div>
							<div className="grid gap-1.5">
								{results.distribution.map((d) => (
									<div key={d.label} className="flex items-center gap-2 text-sm">
										<span className="w-16 shrink-0 text-muted">{d.label}</span>
										<span className="h-3 rounded bg-primary" style={{ width: `${(d.count / maxBucket) * 100}%`, minWidth: d.count ? 8 : 0 }} />
										<span className="text-muted">{d.count}</span>
									</div>
								))}
							</div>
						</div>
					</section>

					<section>
						<h2 className="mb-3 text-xl font-semibold">Pe elev (poreclă)</h2>
						<div className="overflow-hidden rounded-2xl border border-border">
							<table className="w-full text-left text-sm">
								<thead className="bg-bg text-muted">
									<tr>
										<th className="px-4 py-3 font-medium">Poreclă</th>
										<th className="px-4 py-3 font-medium">Teste</th>
										<th className="px-4 py-3 font-medium">Scor mediu</th>
										<th className="px-4 py-3 font-medium">Ultimul</th>
										{releaseGrade && <th className="px-4 py-3 font-medium" />}
									</tr>
								</thead>
								<tbody>
									{results.perNickname.map((n) => (
										<tr key={n.nickname} className="border-t border-border bg-surface">
											<td className="px-4 py-3 font-medium">
												{n.nickname}
												{n.byTopic.length > 0 && (
													<span className="mt-0.5 block text-xs font-normal text-muted">
														{n.byTopic.map((b, i) => `${i ? " · " : ""}${topicLabelBySlug(b.topicSlug)} ×${b.count}`).join("")}
													</span>
												)}
											</td>
											<td className="px-4 py-3">{n.attempts}</td>
											<td className="px-4 py-3">{n.avgPct}%</td>
											<td className="px-4 py-3 text-muted">{fmt(n.lastAt)}</td>
											{releaseGrade && (
												<td className="px-4 py-3 text-right">
													<Form method="post" onSubmit={(e) => { if (!confirm(t("results.release_confirm"))) e.preventDefault(); }}>
														<input type="hidden" name="intent" value="release-nick" />
														<input type="hidden" name="grade" value={releaseGrade} />
														<input type="hidden" name="nickname" value={n.nickname} />
														<button className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent-strong">
															{t("results.release_nick")}
														</button>
													</Form>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					{results.hardest.length > 0 && (
						<section>
							<h2 className="mb-3 text-xl font-semibold">Cele mai grele întrebări</h2>
							<div className="grid gap-2">
								{results.hardest.map((h, i) => (
									<div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
										<span className="line-clamp-1 text-sm">{h.stem}</span>
										<span className="shrink-0 rounded-full bg-sand/40 px-3 py-1 text-xs font-medium">{h.correctPct}% corect · {h.shown}×</span>
									</div>
								))}
							</div>
						</section>
					)}

					{children}
				</div>
			)}
		</>
	);
}
